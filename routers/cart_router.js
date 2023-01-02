const Router = require('express');

const mongoose = require('mongoose');
const Cart = require('../models/cart_model');
const Product = require('../models/product_model');
const checkAuth = require('../middleware/check_authentication_middleware');

const { ObjectId } = mongoose.Types;
const router = new Router();

router.get('/:userId', checkAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const userCart = await Cart.findOne({ userId: userId.trim() });

    res.send(userCart);
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

router.post('/add-product/:userId', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { userId } = req.params;

    const newProductId = productId.trim();
    const newUserId = userId.trim();
    const newQuantity = +quantity;
    const product = await Product.findById({ _id: ObjectId(newProductId) });
    const cart = await Cart.findOne({ userId: ObjectId(newUserId) });

    if (product && cart && newQuantity) {
      const { products } = cart;
      const allProductsIds = products.map((item) => item._id.toString());

      if (products.length && allProductsIds.includes(newProductId)) {
        const indexProduct = allProductsIds.indexOf(newProductId);
        const quantityProduct = products[indexProduct].quantity;

        if (quantityProduct + newQuantity <= 3) {
          await Cart.updateOne(
            {
              $and: [
                { userId: newUserId },
                { products: { $elemMatch: { _id: newProductId } } },
              ],
            },
            { $inc: { 'products.$.quantity': newQuantity } },
          ).then(() => {
            Cart.findById({ _id: cart._id }).then((updatedCart) => {
              res.send(updatedCart);
            });
          });
        } else {
          res.status(400).send('Added the maximum amount of product');
        }
      } else if (quantity <= 3) {
        const newProduct = await Product.aggregate([{
          $match: { _id: ObjectId(newProductId) },
        },
        {
          $addFields: {
            quantity,
          },
        },
        {
          $project: {
            productName: 1,
            description: 1,
            price: 1,
            image: 1,
            _id: 1,
            quantity: 1,
          },
        }]);

        products.push(newProduct[0]);

        await Cart.updateOne({ _id: cart._id }, { products }).then(() => {
          Cart.findById({ _id: cart._id }).then((updatedCart) => {
            res.send(updatedCart);
          });
        });
      } else {
        res.status(400).send('Quantity exceeds the maximum allowable value');
      }
    } else {
      res.status(400).send('No product or cart information received or incorrect quantity value');
    }
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
});

router.delete('/delete/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const newUserId = userId.trim();
    const newProductId = productId.trim();

    if (newUserId && newProductId) {
      await Cart.updateOne(
        { userId: newUserId },
        {
          $pull: { products: { _id: newProductId } },
        },
      );

      const cart = await Cart.findOne({ userId: newUserId });

      res.send(cart);
    } else {
      res.status(400).send('Incorrect data');
    }
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
});

module.exports = router;
