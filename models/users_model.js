const { Schema, model } = require('mongoose');

const User = new Schema({
  userName: { type: String, unique: false, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, unique: false, required: true },
  isAdmin: { type: Boolean, unique: false, required: true },
});

module.exports = model('User', User);
