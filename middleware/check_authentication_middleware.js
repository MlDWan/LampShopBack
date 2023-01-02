const jwt = require('jsonwebtoken');
require('dotenv').config();

const Users = require('../models/users_model');

const checkAuth = (req, res, next) => {
  try {
    const { secretAccess, secretRefresh } = process.env;

    const accessToken = req.headers.authorization
      ? req.headers.authorization.split(' ')[1]
      : undefined;
    const refreshToken = req.headers.cookies
      ? req.headers.cookies.split('=')[1]
      : undefined;
    const renevalTokens = (tokenData) => {
      const payload = {
        email: tokenData.email,
        id: tokenData.id,
      };
      const tokens = {
        accessToken: jwt.sign(payload, secretAccess, {
          expiresIn: '24h',
        }),
        refreshToken: jwt.sign(payload, secretRefresh, {
          expiresIn: '24h',
        }),
      };
      req.user = tokenData;
      req.user.tokens = tokens;
    };

    jwt.verify(
      accessToken,
      secretAccess,
      (errorAccess, verifiedAccessToken) => {
        if (errorAccess) {
          jwt.verify(
            refreshToken,
            secretRefresh,
            (errorRefresh, verifiedRefreshToken) => {
              if (verifiedRefreshToken) {
                if (Users.find({ _id: verifiedRefreshToken.id })) {
                  renevalTokens(verifiedRefreshToken);

                  next();
                } else {
                  res.status(401).send('Incorrect token');
                }
              } else {
                res.status(401).send('You need to log in');
              }
            },
          );
        } else {
          renevalTokens(verifiedAccessToken);

          next();
        }
      },
    );
  } catch (error) {
    res.send(`${error}`);
  }
};

module.exports = checkAuth;
