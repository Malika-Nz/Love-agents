const express = require("express");
const cookie = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const handlebars = require("express-handlebars");
const hbs = require("hbs");
const fs = require("fs");
const createReport = require("docx-templates").default;

const app = express();

// логирование запросов
app.use(morgan("dev"));
// директория со статическими файлами
app.use(express.static(path.join(__dirname, "static")));
// принимаем только json-запросы
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// используем куки
app.use(cookie());
// умеем загружать FormData с аватарками
const multer = require("multer");
const upload = multer();

app.engine(
  "hbs",
  handlebars.engine({
    layoutsDir: "views/layouts",
    defaultLayout: "layout",
    extname: "hbs",
  })
);
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/views/partials"));

// подключаемся к БД
const User = require("./models/user");
const Letter = require("./models/letter");
const Archive = require("./models/archive");
const Payment = require("./models/payment");
const { query } = require("./models/config");
const Review = require("./models/review");

// переадресация на страницы
app.get("/", (req, res) => {
  let email = req.cookies["hola"];
  if (email) {
    res.redirect(301, "/cards");
  } else {
    res.redirect(301, "/reg");
  }
});

// админ-панель
app.get("/admin", async (req, res) => {
  let email = req.cookies["hola"];

  if (email !== "admin@admin") {
    return res.redirect(301, "/reg");
  }

  const users = await User.getAll();
  const archived = await Archive.getAll();
  let today = new Date();

  users.forEach((u) => {
    if (archived.find((a) => a.id === u.id)) {
      u.archived = true;
    }
    u.birthday = today.getFullYear() - u.birthday.getFullYear();
  });

  let letters = await Letter.getAll();

  letters = letters.filter((l) => l.status === "P" || l.status === "G");

  letters.forEach((l) => {
    l.sender = users.find((u) => u.id === l.sender);
    l.recipient = users.find((u) => u.id === l.recipient);

    l.meet_date = l.meet_date.toLocaleDateString();
    l.meet_time = l.meet_time.toLocaleString();

    switch (l.status) {
      case "P":
        l.inProcess = true;
        break;
      case "G":
        l.got = true;
        break;
    }
  });

  const payments = await Payment.getAll();

  res.render("admin.hbs", {
    title: "Админка",
    users,
    total_users: users.length,
    total_archived: archived.length,
    letters,
    payments,
    user: true,
    admin: true,
  });
});

// страница регистрации
app.get("/reg", (req, res) => {
  let email = req.cookies["hola"];

  if (email === "admin@admin") {
    return res.redirect(301, "/admin");
  }
  if (email) {
    return res.redirect(301, "/cards");
  }

  return res.render("registration.hbs", { title: "Регистрация" });
});

// страница с карточками пользователей
app.get("/cards", async (req, res) => {
  let email = req.cookies["hola"];

  const query = req.query;

  if (email === "admin@admin") {
    return res.redirect(301, "/admin");
  }
  if (!email) {
    return res.redirect(301, "/reg");
  }

  const user = await User.getOne(email);

  if (!user) {
    res.cookie("hola", "", {
      expires: new Date(Date.now() - 1),
    });
    return res.redirect(301, "/reg");
  }

  // получаем всех пользователей, кроме текущего и тех, кого он хочет видеть
  let usersArray = await User.getAll();
  usersArray = usersArray.filter((u) => u.email !== email);
  usersArray = usersArray.filter((u) => u.gender === user.gender_cand);

  // получаем всех пользователей, которые не попали в архив
  const archived = await Archive.getAll();
  usersArray = usersArray.filter((u) => !archived.find((a) => a.id === u.id));

  // из даты рождения получаем возраст
  let today = new Date();
  usersArray = usersArray.map((u) => {
    u.birthday = today.getFullYear() - u.birthday.getFullYear();
    return u;
  });
  usersCities = new Array(...new Set(usersArray.map((u) => u.city)));

  // фильтрация
  if (query.fio) {
    usersArray = usersArray.filter((u) => u.fio.includes(query.fio));
  }
  if (query.start_age) {
    usersArray = usersArray.filter((u) => u.birthday >= +query.start_age);
  }
  if (query.end_age) {
    usersArray = usersArray.filter((u) => u.birthday <= +query.end_age);
  }
  if (query.city) {
    usersArray = usersArray.filter((u) => u.city === query.city);
  }

  // добавляем активность первой карточке (для отображения)
  if (usersArray.length > 0) {
    usersArray[0].active = true;
  }

  return res.render("cards.hbs", {
    user: user,
    users: usersArray,
    title: "Карточки",
    cities: usersCities,
    fio: query.fio,
    start_age: query.start_age,
    end_age: query.end_age,
    city: query.city,
  });
});

// страница с анкетой пользователя
app.get("/my_ancket", async (req, res) => {
  let email = req.cookies["hola"];

  if (email === "admin@admin") {
    return res.redirect(301, "/admin");
  }
  if (!email) {
    return res.redirect(301, "/reg");
  }

  const user = await User.getOne(email);
  const users = await User.getAll();
  if (!user) {
    return res.redirect(301, "/reg");
  }

  // получаем возраст пользователя
  let today = new Date();
  user.birthday = today.getFullYear() - user.birthday.getFullYear();

  // получаем все письма пользователя
  const letters = await Letter.getAllByUser(user.id);
  // получаем все письма, которые пользователь отправил
  const letters_sent = letters.filter(
    (l) => l.sender === user.id && ["D", "G", "R"].includes(l.status)
  );
  letters_sent.forEach((l) => {
    l.recipient = users.find((u) => u.id === l.recipient);
    if (Number.isInteger(l.recipient.birthday)) {
      l.recipient.birthday =
        today.getFullYear() - l.recipient.birthday.getFullYear();
    }
    l.sender = user;
    l.meet_date = l.meet_date.toLocaleDateString();
    l.meet_time = l.meet_time.substr(0, 5);

    switch (l.status) {
      case "D":
        l.declined = true;
        break;
      case "G":
        l.got = true;
        break;
      case "R":
        l.rejected = true;
        break;
    }
  });
  // получаем все письма, которые пользователь получил
  const letters_received = letters.filter(
    (l) => l.recipient === user.id && ["A", "G", "R"].includes(l.status)
  );
  letters_received.forEach((l) => {
    l.sender = users.find((u) => u.id === l.sender);
    if (!Number.isInteger(l.sender.birthday)) {
      l.sender.birthday = today.getFullYear() - l.sender.birthday.getFullYear();
    }
    l.meet_date = l.meet_date.toLocaleDateString();
    l.meet_time = l.meet_time.substr(0, 5);

    if (l.status === "G" || l.status === "R") {
      l.readed = true;
      l.blocked = true;
    }
  });

  // отзывы, которые должен оставить пользователь
  const lettersToReview = await Review.notExistsByUser(user.id);
  const formattedLettersToReview = await Promise.all(
    lettersToReview.map(async (letter) => {
      partnerId = letter.sender === user.id ? letter.recipient : letter.sender;
      letter.partner = await User.getOneById(partnerId);
      letter.partner.name = letter.partner.fio.split(" ")[1];
      letter.meet_date = letter.meet_date.toLocaleDateString();
      return letter;
    })
  );

  return res.render("my_ancket.hbs", {
    user,
    letters_sent,
    letters_received,
    title: "Моя анкета",
    letters_to_review: formattedLettersToReview,
  });
});

// страница с рекомендациями по безопасности
app.get("/security", async (req, res) => {
  let email = req.cookies["hola"];

  if (email === "admin@admin") {
    return res.redirect(301, "/admin");
  }

  if (!email) {
    return res.redirect(301, "/reg");
  }

  const user = await User.getOne(email);

  return res.render("security.hbs", { title: "Безопасность", user });
});

// страница о защите персональных данных
app.get("/protect", async (req, res) => {
  let email = req.cookies["hola"];

  if (email === "admin@admin") {
    return res.redirect(301, "/admin");
  }

  if (!email) {
    return res.redirect(301, "/reg");
  }

  const user = await User.getOne(email);

  return res.render("protect.hbs", { title: "Защита", user });
});

// страница с контактами
app.get("/contacts", async (req, res) => {
  let email = req.cookies["hola"];

  if (email === "admin@admin") {
    return res.redirect(301, "/admin");
  }

  if (!email) {
    return res.redirect(301, "/reg");
  }

  const user = await User.getOne(email);

  return res.render("contacts.hbs", { title: "Контакты", user });
});

// страница с помощью
app.get("/h", async (req, res) => {
  console.log("test");
  let email = req.cookies["hola"];

  if (email === "admin@admin") {
    return res.redirect(301, "/admin");
  }

  if (!email) {
    return res.redirect(301, "/reg");
  }

  const user = await User.getOne(email);

  return res.render("helpme.hbs", { title: "Помощь", user });
});

// страница с пользовательским соглашением
app.get("/politicy", async (req, res) => {
  let email = req.cookies["hola"];

  if (email === "admin@admin") {
    return res.redirect(301, "/admin");
  }

  if (!email) {
    return res.redirect(301, "/reg");
  }

  const user = await User.getOne(email);

  return res.render("politicy.hbs", {
    title: "Политика конфиденциальности",
    user,
  });
});

// обработка формы регистрации
app.post("/signup", upload.single("avatar"), async function (req, res) {
  const obj = JSON.parse(JSON.stringify(req.body));

  if (!obj.fio) {
    return res.status(400).json({ error: "Ошибка в имени пользователя" });
  }
  if (!obj.birthday) {
    return res.status(400).json({ error: "Ошибка в дате рождения" });
  }
  if (!obj.password || obj.password.length < 4) {
    return res
      .status(400)
      .json({ error: "Длина пароля должна быть более 4 символов" });
  }

  let today = new Date();
  let birthday = new Date(obj.birthday);
  if (today.getFullYear() - birthday.getFullYear() < 18) {
    return res.status(400).json({ error: "Возраст должен быть более 18 лет" });
  }

  const user_email = await User.getOne(obj.email);
  if (user_email) {
    return res
      .status(400)
      .json({ error: "Пользователь c таким email уже существует" });
  }

  const user = obj;

  let avatar = req.file.buffer;
  let base64String = Buffer.from(avatar).toString("base64");
  user.avatar = "data:image/jpeg;base64," + base64String;

  user.gender = user.gender.toString();
  user.gender_cand = user.gender_cand.toString();

  await User.create(user);

  res.cookie("hola", user.email, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });
  res.status(201).end();
});

// обработка формы авторизации
app.post("/login", upload.none(), async function (req, res) {
  const obj = JSON.parse(JSON.stringify(req.body));
  const { email, password } = obj;

  if (email === "admin@admin" && password === "admin@admin") {
    res.cookie("hola", email, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    return res.status(200).end();
  }
  if (!email) {
    return res.status(400).json({ error: "Пустая почта" });
  }
  if (!password) {
    return res.status(400).json({ error: "Пустой пароль" });
  }

  const user = await User.getOne(email);

  if (!user || user.password !== password) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  const archived = await Archive.getOne(user.id);

  if (archived) {
    return res.status(400).json({ error: "Пользователь заблокирован" });
  }

  res.cookie("hola", email, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });
  res.status(200).end();
});

// выход из аккаунта
app.get("/logout", async function (req, res) {
  const email = req.cookies["hola"];

  if (!email) {
    return res.redirect(301, "/reg");
  }
  res.clearCookie("hola");
  return res.redirect(301, "/reg");
});

// выход из аккаунта
app.post("/logout", async function (req, res) {
  const email = req.cookies["hola"];

  if (!email) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  if (email === "admin@admin") {
    res.clearCookie("hola");
    return res.status(200).end();
  }

  const user = await User.getOne(email);

  if (!email || !user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  res.clearCookie("hola");
  return res.status(200).end();
});

// обновление данных пользователя
app.post("/update", upload.single("avatar"), async function (req, res) {
  const obj = JSON.parse(JSON.stringify(req.body));
  const email = req.cookies["hola"];

  if (!email) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }
  if (!obj.fio) {
    return res.status(400).json({ error: "Ошибка в имени пользователя" });
  }
  if (!obj.city) {
    return res.status(400).json({ error: "Ошибка в городе" });
  }
  if (!obj.about) {
    return res.status(400).json({ error: "Ошибка в описании" });
  }
  if (!obj.telegram) {
    return res.status(400).json({ error: "Ошибка в телеграмме" });
  }

  if (req.file) {
    let avatar = req.file.buffer;
    let base64String = Buffer.from(avatar).toString("base64");
    obj.avatar = "data:image/jpeg;base64," + base64String;
  }

  const user = await User.getOne(email);
  if (!user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  await User.update(email, obj);

  res.status(200).end();
});

// обновление пароля
app.post("/update_password", upload.none(), async function (req, res) {
  const obj = JSON.parse(JSON.stringify(req.body));
  const email = req.cookies["hola"];

  if (!email) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  const user = await User.getOne(email);
  if (!user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }
  if (obj.password !== user.password) {
    return res.status(400).json({ error: "Неверный пароль" });
  }
  if (!obj.new_password || obj.new_password.length < 4) {
    return res
      .status(400)
      .json({ error: "Длина нового пароля должна быть более 4 символов" });
  }
  if (obj.password === obj.new_password) {
    return res
      .status(400)
      .json({ error: "Новый пароль должен отличаться от старого" });
  }

  User.updatePassword(email, obj.new_password);

  res.status(200).end();
});

// архивация пользователя
app.post("/archivate", upload.none(), async function (req, res) {
  let email = req.cookies["hola"];
  const obj = JSON.parse(JSON.stringify(req.body));

  if (email === "admin@admin") {
    obj.reason = "Заблокирован администратором";

    const user = await User.getOneById(obj.id);

    if (!user) {
      return res.status(400).json({ error: "Пользователь не найден" });
    }

    await Archive.create(obj);

    return res.status(200).end();
  }

  const user = await User.getOne(email);

  if (!email || !user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }
  if (!obj.reason) {
    return res.status(400).json({ error: "Причина не указана" });
  }

  obj.id = user.id;
  await Archive.create(obj);

  res.clearCookie("hola");
  res.status(200).end();
});

// восстановление пользователя
app.post("/unarchivate", upload.none(), async function (req, res) {
  let email = req.cookies["hola"];
  const obj = JSON.parse(JSON.stringify(req.body));

  if (email === "admin@admin") {
    const user = await User.getOneById(obj.id);

    if (!user) {
      return res.status(400).json({ error: "Пользователь не найден" });
    }

    await Archive.delete(obj.id);

    return res.status(200).end();
  }

  return res
    .status(400)
    .json({ error: "Только администратор может разблокировать пользователя" });
});

// отправка приглашения на встречу
app.post("/invite", upload.none(), async function (req, res) {
  const obj = JSON.parse(JSON.stringify(req.body));
  const email = req.cookies["hola"];

  if (!email) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  const user = await User.getOne(email);
  if (!user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  obj.sender = user.id;
  obj.place = obj.place.toString();
  obj.status = "P";
  // obj.status = 'A';
  obj.recipient = +obj.recipient;

  Letter.create(obj);

  res.status(200).end();
});

// обновление статуса приглашения
app.post("/update_letter", upload.none(), async function (req, res) {
  const obj = JSON.parse(JSON.stringify(req.body));
  const email = req.cookies["hola"];

  if (email === "admin@admin") {
    const letter = await Letter.getOneById(obj.id);

    if (!letter) {
      return res.status(400).json({ error: "Письмо не найдено" });
    }

    await Letter.update(obj.id, obj);

    return res.status(200).end();
  }

  if (!email) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  const user = await User.getOne(email);
  if (!user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  if (!obj.id) {
    return res.status(400).json({ error: "Передано пустое значение id" });
  }

  const letter = await Letter.getOneById(obj.id);
  if (!letter) {
    return res.status(400).json({ error: "Письмо не найдено" });
  }

  if (obj.type === "letter" && ["G", "R"].includes(letter.status)) {
    obj.readed = undefined;
  }

  await Letter.update(obj.id, obj);

  res.status(200).end();
});

// получение отчёта по свиданию
app.get("/report_letter", upload.none(), async function (req, res) {
  const obj = req.query;

  if (!obj.id) {
    return res.status(400).json({ error: "Передано пустое значение id" });
  }

  const letter = await Letter.getOneById(obj.id);
  if (!letter) {
    return res.status(400).json({ error: "Письмо не найдено" });
  }
  letter.meet_date = letter.meet_date.toLocaleDateString("ru-RU");
  letter.meet_time = letter.meet_time.split(":").slice(0, 2).join(":");
  letter.sender = await User.getOneById(letter.sender);
  letter.recipient = await User.getOneById(letter.recipient);

  const reviews = await Review.getAllByLetter(letter.id);
  const formatedReviews = await Promise.all(
    reviews.map(async (review) => {
      switch (review.status) {
        case "L":
          review.status = "Свидание понравилось респонденту";
          break;
        case "D":
          review.status = "Свидание разочаровало респондента";
          break;
        case "C":
          review.status = "Свидание отменено";
          break;
      }
      review.author = await User.getOneById(review.author);
      review.date = review.created_at.toLocaleString();
      return review;
    })
  );

  // заполнение шаблона docx
  const template = fs.readFileSync("static/docx/report.docx", "binary");

  const buffer = await createReport({
    template,
    data: {
      date: letter.meet_date,
      time: letter.meet_time,
      sender: letter.sender,
      recipient: letter.recipient,
      place: letter.place,
      address: letter.address,
      body: letter.body,
      reviews: formatedReviews,
    },
  });

  // сохранение файла
  const filename = `report_${letter.id}.docx`;
  fs.writeFileSync(`static/docx/${filename}`, buffer);

  // отправка файла
  res.download(`static/docx/${filename}`, filename, function (err) {
    if (err) {
      console.log(err);
    } else {
      // удаление файла
      fs.unlink(`static/docx/${filename}`, function (err) {
        if (err) {
          console.log(err);
        }
      });
    }
  });
});

// произвести оплату
app.post("/pay", upload.none(), async function (req, res) {
  const obj = JSON.parse(JSON.stringify(req.body));
  const email = req.cookies["hola"];

  if (!email) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  const user = await User.getOne(email);
  if (!user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  if (!obj.card_number || !obj.card_date || !obj.card_cvv) {
    return res.status(400).json({ error: "Ошибка ввода данных" });
  }

  if (obj.card_number.length !== 16) {
    return res.status(400).json({ error: "Неверный номер карты" });
  }

  if (obj.card_date.length !== 5) {
    return res.status(400).json({ error: "Неверная дата карты" });
  }

  if (obj.card_cvv.length !== 3) {
    return res.status(400).json({ error: "Неверный cvv" });
  }

  obj.user_id = user.id;
  obj.amount = 15;

  const pay = await Payment.create(obj);

  if (!pay) {
    return res.status(400).json({ error: "Ошибка оплаты" });
  }

  res.status(200).end();
});

// добавить отзыв о свидании
app.post("/review", async (req, res) => {
  const obj = JSON.parse(JSON.stringify(req.body));

  console.log(obj);
  const email = req.cookies["hola"];

  if (!email) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  const user = await User.getOne(email);
  if (!user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  const letter = await Letter.getOneById(obj.letter);
  if (!letter) {
    return res.status(400).json({ error: "Письмо не найдено" });
  }
  if (letter.sender !== user.id && letter.recipient !== user.id) {
    return res.status(400).json({ error: "Ошибка доступа" });
  }

  obj.author = user.id;

  const review = await Review.create(obj);

  if (!review) {
    return res.status(400).json({ error: "Ошибка добавления отзыва" });
  }

  res.status(200).end();
});

app.get("/review/user/:id", async (req, res) => {
  const email = req.cookies["hola"];

  if (email === "admin@admin") {
    return res.status(400).json({ error: "Ошибка доступа" });
  }

  const userId = req.params.id;

  const reviews = await Review.getAllByUser(userId);

  return res.status(200).json({ reviews });
});

// данные о пользователе
app.get("/me", async function (req, res) {
  let email = req.cookies["hola"];

  const user = await User.getOne(email);

  if (!email || !user) {
    return res.status(401).end();
  }

  res.json(user);
});

// запуск сервера
app.listen(3333, () => {
  console.log("Application listening on port 3333");
});
