const path = require('path');
const express = require('express');
const app = express();

app.use(express.urlencoded());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../FRONTEND')))

const multer = require('multer');

app.get('/', (req, res) => {
    console.log(req.query)
    res.send({ message: req.query });
});

app.post('/signup', multer().fields([]), function(req, res) {
    const obj = JSON.parse(JSON.stringify(req.body));
    console.log(obj);
    res.send(JSON.stringify(req.body));
});

app.listen(3333, () => {
    console.log('Application listening on port 3333');
});