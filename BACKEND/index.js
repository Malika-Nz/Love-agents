const path = require('path');
const express = require('express');
const app = express();
var bodyParser = require('body-parser')

app.use(express.urlencoded({ extended: false }))
app.use(express.json());

app.use(bodyParser.json())


// app.use(express.static(path.join(__dirname, '../FRONTEND')))
app.get('/', (req, res) => {
    console.log(req.body)
    res.send({ message: req.body });
});

app.post('/signup', function(req, res) {
    res.send({ message: req.body });
});

app.listen(3333, () => {
    console.log('Application listening on port 3333!');
});