const express = require('express')
const app = express();
var bodyParser = require('body-parser')
var wxRouter = require('./router');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static('static'));
app.use('/wx', wxRouter);
app.listen(8888)
