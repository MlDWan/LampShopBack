const { Schema, model } = require('mongoose');

const Product = new Schema({
  productName: { type: String, unique: false, required: true },
  price: { type: Number, unique: false, required: true },
  description: { type: String, unique: false, required: true },
  image: {
    name: { type: String, unique: false, required: true },
    newName: { type: String, unique: true, required: true },
    url: { type: String, unique: false, required: true },
  },
  amount: {
    type: Number,
    unique: false,
    required: true,
  },
});

module.exports = model('Product', Product);
