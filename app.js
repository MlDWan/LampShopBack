const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

require('dotenv').config();

const routes = require('./routes/index');

const app = express();

const { PORT, DB_URI } = process.env;

app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(cors());

mongoose.connect(DB_URI);

app.listen(PORT, () => {
  console.log(`server start on ${PORT} port`);
});

app.use('/api', routes);

module.exports = app;
