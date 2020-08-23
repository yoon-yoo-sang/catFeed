const express = require('express');
const app = express();
const port = 3000;
const routing = require('./lib/info');
const bodyParser = require('body-parser');
const helmet = require('helmet');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet())

app.use('/', routing);

app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!");
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port);