const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Router = require('express');
const validator = require('validator');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;

require('dotenv').config();

const User = require('../models/users_model');
const Cart = require('../models/cart_model');
const Product = require('../models/product_model');
const checkAuth = require('../middleware/check_authentication_middleware');

const { secretAccess, secretRefresh } = process.env;

const router = new Router();

const generateTokens = ({ id, email }, res) => {
  email.trim();

  if (id && email) {
    const payload = { id, email };
    const accessToken = jwt.sign(payload, secretAccess, { expiresIn: '24h' });
    const refreshToken = jwt.sign(payload, secretRefresh, { expiresIn: '24h' });

    return {
      accessToken,
      refreshToken,
    };
  }
  return res.status(400).send('Incorrect data');
};

router.post('/registration', async (req, res) => {
  const { email, userName, password } = req.body;
  const newEmail = email.trim();
  const newPassword = password.trim();
  const newUserName = userName.trim();

  try {
    if (newEmail && newPassword && newUserName) {
      const user = await User.findOne({ email: newEmail });

      if (!user) {
        if (validator.isStrongPassword(newPassword)) {
          await bcrypt.hash(newPassword, 10).then((hash) => {
            User.create({
              email: newEmail,
              isAdmin: false,
              userName: newUserName,
              password: hash,
            }).then((newUser) => {
              Cart.create({ userId: newUser._id, products: [] }).then(
                (data) => {
                  const token = generateTokens({
                    id: newUser._id,
                    email: newUser.email,
                  });

                  res.cookie('refreshToken', token.refreshToken, {
                    maxAge: 43200000,
                    httpOnly: true,
                  });

                  return res.json({ data, ...token });
                },
              );
            });
          });
        } else {
          res
            .status(400)
            .send(
              'Password must be at least 8 characters long, 1 lowercase letter, 1 uppercare letter, 1 number and 1 special character(!@#$%^&*)',
            );
        }
      } else {
        res.status(400).send(`Incorrect email or ${email} already registered`);
      }
    } else {
      res.status(400).send('All fields must be completed');
    }
  } catch (error) {
    res.status(400).json({ message: `${error} ` });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, localCart } = req.body;
  const newEmail = email.trim();
  const newPassword = password.trim();

  try {
    if (newEmail && newPassword) {
      const user = await User.findOne({ email: newEmail });

      if (user) {
        const userPassword = bcrypt.compareSync(newPassword, user.password);

        if (userPassword) {
          const token = generateTokens({ id: user._id, email: user.email });

          res.cookie('refreshToken', token.refreshToken, {
            maxAge: 43200000,
            httpOnly: true,
          });
          const userVerified = jwt.verify(token.accessToken, secretAccess);

          req.user = { token: token.accessToken, userVerified };

          const usersFilter = await User.aggregate([
            { $match: { _id: ObjectId(user._id) } },
            {
              $lookup: {
                from: 'carts',
                localField: '_id',
                foreignField: 'userId',
                as: 'cart',
              },
            },
          ]);

          const userInfo = usersFilter[0];

          userInfo.cart = userInfo.cart[0].products;

          if (localCart ? localCart.length : undefined) {
            const newCart = [];

            for (let index = 0; index < localCart.length; index += 1) {
              const product = Product.aggregate([
                {
                  $match: { _id: ObjectId(localCart[index]._id) },
                },
                {
                  $addFields: {
                    quantity:
                      localCart[index].quantity >= 3
                        ? 3
                        : localCart[index].quantity,
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
                },
              ]);

              newCart.push(product);
            }
            const products = (await Promise.all(newCart)).map(
              (item) => item[0],
            );

            await Cart.updateOne(
              {
                userId: userInfo._id,
              },
              {
                products,
              },
            );
            const updatedCart = await Cart.findOne({ userId: userInfo._id });

            userInfo.cart = updatedCart.products;
          }
          const data = {
            user: userInfo,
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
          };

          return res.send(data);
        }

        return res.status(400).send('Incorrect password');
      }

      return res.status(400).send('User not found');
    }
    return res.status(400).send('All fields must be completed');
  } catch (error) {
    return res.status(400).json({ message: `${error}` });
  }
});

router.delete('/delete/:_id', checkAuth, async (req, res) => {
  try {
    const { _id } = req.params;

    if (!_id) {
      res.status(400).json({ message: 'Incorrect id' });
    } else {
      await User.deleteOne({ _id });

      const products = await User.find();

      res.send(products);
    }
  } catch (error) {
    res.status(400).json({ message: 'Error while deleting', error });
  }
});

router.get('/checkAuth', checkAuth, async (req, res) => {
  try {
    const { id } = req.user;

    const usersFilter = await User.aggregate([
      { $match: { _id: ObjectId(id) } },

      {
        $lookup: {
          from: 'carts',
          localField: '_id',
          foreignField: 'userId',
          pipeline: [
            {
              $project: {
                _id: 0,
                products: 1,
              },
            },
          ],
          as: 'cart',
        },
      },
    ]);
    const userInfo = usersFilter[0];

    userInfo.cart = userInfo.cart[0].products;

    const { accessToken, refreshToken } = req.user.tokens;

    const data = {
      user: userInfo,
      accessToken,
      refreshToken,
    };

    return res.send(data);
  } catch (error) {
    return res.send(`${error}`);
  }
});

module.exports = { ...router, generateTokens };
