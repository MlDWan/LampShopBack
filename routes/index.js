const express = require('express');

const cart_router = require('../routers/cart_router');
const product_router = require('../routers/product_router');
const user_router = require('../routers/user_router');

const app = express();

app.use('/carts', cart_router);
app.use('/products', product_router);
app.use('/users', user_router);

module.exports = app;
