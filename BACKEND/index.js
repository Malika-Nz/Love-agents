const express = require('express');
const cookie = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const handlebars = require('express-handlebars');
const hbs = require("hbs");

const app = express();

// логирование запросов
app.use(morgan('dev'));
// директория со статическими файлами
app.use(express.static(path.join(__dirname, 'static')))
// принимаем только json-запросы
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// используем куки
app.use(cookie());
// умеем загружать FormData с аватарками
const multer = require('multer');
const upload = multer();

app.engine("hbs", handlebars.engine(
    {
        layoutsDir: "views/layouts", 
        defaultLayout: "layout",
        extname: "hbs"
    }
))
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/views/partials"));

// подключаемся к БД
const User = require('./models/user');
const Letter = require('./models/letter');
const Archive = require('./models/archive');
const Payment = require('./models/payment');

app.get('/', (req, res) => {
    let email = req.cookies['hola'];
    if (email) {
        res.redirect(301, '/cards');
    } else {
        res.redirect(301, '/reg');
    }
});

app.get('/reg', (req, res) => {
    let email = req.cookies['hola'];

    if (email) {
        return res.redirect(301, '/cards');
    }

    return res.render('registration.hbs', {title: 'Регистрация'});
});

app.get('/cards', async (req, res) => {
    let email = req.cookies['hola'];

    if (!email) {
        return res.redirect(301, '/reg');
    }

    const user = await User.getOne(email);

    // получаем всех пользователей, кроме текущего и тех, кого он хочет видеть
    let usersArray = await User.getAll();
    usersArray = usersArray.filter(u => u.email !== email);
    usersArray = usersArray.filter(u => u.gender === user.gender_cand);

    // получаем всех пользователей, которые не попали в архив
    const archived = await Archive.getAll();
    usersArray = usersArray.filter(u => !archived.find(a => a.id === u.id));

    // добавляем активность первой карточке (для отображения)
    usersArray[0].active = true;

    // из даты рождения получаем возраст
    let today = new Date();
    usersArray = usersArray.map(u => {
        u.birthday = today.getFullYear() - u.birthday.getFullYear();
        return u;
    });

    return res.render('cards.hbs', {user: user, users: usersArray});
});

app.get('/my_ancket', async (req, res) => {
    let email = req.cookies['hola'];
    
    if (!email) {
        return res.redirect(301, '/reg');
    }

    const user = await User.getOne(email);
    const users = await User.getAll();
    if (!user) {
        return res.redirect(301, '/reg');
    }

    // получаем возраст пользователя
    let today = new Date();
    user.birthday = today.getFullYear() - user.birthday.getFullYear();

    // получаем все письма пользователя
    const letters = await Letter.getAllByUser(user.id);
    // получаем все письма, которые пользователь отправил
    const letters_sent = letters.filter(l => l.sender === user.id && ['A', 'D', 'G', 'R'].includes(l.status));
    letters_sent.forEach(l => {
        l.recipient = users.find(u => u.id === l.recipient);
        l.recipient.birthday = today.getFullYear() - l.recipient.birthday.getFullYear();
        l.meet_date = l.meet_date.toLocaleDateString();
        l.meet_time = l.meet_time.substr(0, 5);

        switch (l.status) {
            case 'A':
                l.accepted = true;
                break;
            case 'D':
                l.declined = true;
                break;
            case 'G':
                l.got = true;
                break;
            case 'R':
                l.rejected = true;
                break;
        }
    });
    // получаем все письма, которые пользователь получил
    const letters_received = letters.filter(l => l.recipient === user.id && ['A', 'G', 'R'].includes(l.status));
    letters_received.forEach(l => {
        l.sender = users.find(u => u.id === l.sender);
        l.sender.birthday = today.getFullYear() - l.sender.birthday.getFullYear();
        l.meet_date = l.meet_date.toLocaleDateString();
        l.meet_time = l.meet_time.substr(0, 5);
        
        if (l.status === 'G' || l.status === 'R') {
            l.readed = true;
            l.blocked = true;
        }
    });

    return res.render('my_ancket.hbs', {user, letters_sent, letters_received});
});

app.post('/signup', upload.single('avatar'), async function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    
    if (!obj.fio) {
        return res.status(400).json({error: "Ошибка в имени пользователя"})
    }
    if (!obj.birthday) {
        return res.status(400).json({error: "Ошибка в дате рождения"})
    }
    if (!obj.password || obj.password.length < 4) {
        return res.status(400).json({error: "Длина пароля должна быть более 4 символов"})
    }
    
    let today = new Date();
    let birthday = new Date(obj.birthday);
    console.log(today.getFullYear() - birthday.getFullYear(), birthday);
    if (today.getFullYear() - birthday.getFullYear() < 18) {
        return res.status(400).json({error: "Возраст должен быть более 18 лет"})
    }

    const user_email = await User.getOne(obj.email);
    if (user_email) {
        return res.status(400).json({error: "Пользователь c таким email уже существует"})
    }

    const user = obj;

    let avatar = req.file.buffer;
    let base64String = Buffer.from(avatar).toString('base64');
    user.avatar = 'data:image/jpeg;base64,' + base64String;

    user.gender = user.gender.toString();
    user.gender_cand = user.gender_cand.toString();
    
    await User.create(user);

    res.cookie('hola', user.email, {expires: new Date(Date.now() + 1000 * 60 * 60 * 24)});
    res.status(201).end();
});

app.post('/login', upload.none(), async function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    const { email, password } = obj;

    if (!email) {
        return res.status(400).json({error: "Пустая почта"})
    }
    if (!password) {
        return res.status(400).json({error: "Пустой пароль"})
    }

    const user = await User.getOne(email);

    if (!user || user.password !== password) {
        return res.status(400).json({error: "Пользователь не найден"})
    }
    
    const archived = await Archive.getOne(user.id);

    if (archived) {
        return res.status(400).json({error: "Пользователь заблокирован"})
    }

    res.cookie('hola', email, {expires: new Date(Date.now() + 1000 * 60 * 60 * 24)});
    res.status(200).end();
});

app.get('/logout', async function(req, res) {
    const email = req.cookies['hola'];

    if (!email) {
        return res.redirect(301, '/reg');
    }
    res.clearCookie('hola');
    return res.redirect(301, '/reg');
});

app.post('/logout', async function(req, res) {
    const email = req.cookies['hola'];

    const user = await User.getOne(email);
    
    if (!email || !user) {
        return res.status(400).json({error: "Пользователь не найден"})
    }
    
    res.clearCookie('hola');
    return res.status(200).end();
});

app.post('/update', upload.single('avatar'), async function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    const email = req.cookies['hola'];

    if (!email) {
        return res.status(400).json({error: "Пользователь не найден"})
    }
    if (!obj.fio) {
        return res.status(400).json({error: "Ошибка в имени пользователя"})
    }
    if (!obj.city) {
        return res.status(400).json({error: "Ошибка в городе"})
    }
    if (!obj.about) {
        return res.status(400).json({error: "Ошибка в описании"})
    }
    if (!obj.telegram) {
        return res.status(400).json({error: "Ошибка в телеграмме"})
    }

    if (req.file) {
        let avatar = req.file.buffer;
        let base64String = Buffer.from(avatar).toString('base64');
        obj.avatar = 'data:image/jpeg;base64,' + base64String;
    }

    const user = await User.getOne(email);
    if (!user) {
        return res.status(400).json({error: "Пользователь не найден"})
    }

    await User.update(email, obj);

    res.status(200).end();
});

app.post('/update_password', upload.none(), async function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    const email = req.cookies['hola'];

    if (!email) {
        return res.status(400).json({error: "Пользователь не найден"})
    }

    const user = await User.getOne(email);
    if (!user) {
        return res.status(400).json({error: "Пользователь не найден"})
    }
    if (obj.password !== user.password) {
        return res.status(400).json({error: "Неверный пароль"})
    }
    if (!obj.new_password || obj.new_password.length < 4) {
        return res.status(400).json({error: "Длина нового пароля должна быть более 4 символов"})
    }
    if (obj.password === obj.new_password) {
        return res.status(400).json({error: "Новый пароль должен отличаться от старого"})
    }

    User.updatePassword(email, obj.new_password);

    res.status(200).end();
});

app.post('/archivate', upload.none(), async function(req, res) {
    let email = req.cookies['hola'];
    const obj = JSON.parse(JSON.stringify(req.body));

    const user = await User.getOne(email);

    if (!email || !user) {
        return res.status(400).json({error: "Пользователь не найден"})
    }
    if (!obj.reason) {
        return res.status(400).json({error: "Причина не указана"});
    }

    obj.id = user.id;
    await Archive.create(obj);

    res.clearCookie('hola');
    res.status(200).end();
});


app.post('/invite', upload.none(), async function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    const email = req.cookies['hola'];

    if (!email) {
        return res.status(400).json({error: "Пользователь не найден"})
    }

    const user = await User.getOne(email);
    if (!user) {
        return res.status(400).json({error: "Пользователь не найден"})
    }

    obj.sender = user.id;
    obj.place = obj.place.toString();
    // obj.status = 'P';
    obj.status = 'A';
    obj.recipient = +obj.recipient;

    Letter.create(obj);

    res.status(200).end();
});


app.post('/update_letter', upload.none(), async function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    const email = req.cookies['hola'];

    if (!email) {
        return res.status(400).json({error: "Пользователь не найден"})
    }

    const user = await User.getOne(email);
    if (!user) {
        return res.status(400).json({error: "Пользователь не найден"})
    }

    if (!obj.id) {
        return res.status(400).json({error: "Письмо не найдено"})
    }

    await Letter.update(obj.id, obj);

    res.status(200).end();
});

app.post('/pay', upload.none(), async function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    const email = req.cookies['hola'];

    if (!email) {
        return res.status(400).json({error: "Пользователь не найден"})
    }

    const user = await User.getOne(email);
    if (!user) {
        return res.status(400).json({error: "Пользователь не найден"})
    }

    if (!obj.card_number || !obj.card_date || !obj.card_cvv) {
        return res.status(400).json({error: "Ошибка ввода данных"})
    }

    if (obj.card_number.length !== 16) {
        return res.status(400).json({error: "Неверный номер карты"})
    }

    if (obj.card_date.length !== 5) {
        return res.status(400).json({error: "Неверная дата карты"})
    }

    if (obj.card_cvv.length !== 3) {
        return res.status(400).json({error: "Неверный cvv"})
    }

    obj.user_id = user.id;
    obj.amount = 15;

    const pay = await Payment.create(obj);

    if (!pay) {
        return res.status(400).json({error: "Ошибка оплаты"})
    }

    res.status(200).end();
});

app.get('/me', async function (req, res) {
    let email = req.cookies['hola'];

    const user = await User.getOne(email);

    if (!email || !user) {
        return res.status(401).end();
    }

    res.json(user);
});

app.listen(3333, () => {
    console.log('Application listening on port 3333');
});