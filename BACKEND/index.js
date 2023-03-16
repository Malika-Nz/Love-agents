const express = require('express');
const cookie = require('cookie-parser');
const morgan = require('morgan');
const uuid = require('uuid').v4;
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
hbs.registerPartials(__dirname + "/views/partials");

// БД пользователей
const users = {
	'azat@mail.ru': {
		email: 'azat@mail.ru',
		password: 'password',
		age: 21,
	},
}

// словарь вида <ip>: <email>
ids = {}

app.get('/', (req, res) => {
    let id = req.cookies['hola'];
    if (ids[id]) {
        res.redirect(301, '/cards');
    } else {
        res.redirect(301, '/reg');
    }
});

app.get('/reg', (_, res) => {
    res.render('registration.hbs', {title: 'Регистрация'});
});

app.get('/cards', (req, res) => {
    let id = req.cookies['hola'];
    let email = ids[id];
    if (email) {
        res.render('cards.hbs', {user: users[email]});
    } else {
        res.redirect(301, '/reg');
    }
});

app.post('/signup', upload.single('avatar'), function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    console.log(obj);
    const avatar = req.file;
    
    if (!obj.fio) {
        return res.status(400).json({error: "Ошибка в имени пользователя"})
    }
    if (!obj.birthday) {
        return res.status(400).json({error: "Ошибка в дате рождения"})
    }
    if (!obj.password || obj.password.length < 4) {
        return res.status(400).json({error: "Длина пароля более 4 символов"})
    }
    if (ids[obj.email]) {
        return res.status(400).json({error: "Пользователь уже существует"})
    }

    const id = uuid();
    users[obj.email] = obj;
    ids[id] = obj.email;

    res.cookie('hola', id, {expires: new Date(Date.now() + 1000 * 60 * 10)});
    res.status(201).json({id});
});

app.get('/me', function (req, res) {
    let id = req.cookies['hola'];
    let email = ids[id];
    if (!email || !users[email]) {
        return res.status(401).end();
    }

    res.json(users[email]);
});

app.listen(3333, () => {
    console.log('Application listening on port 3333');
});