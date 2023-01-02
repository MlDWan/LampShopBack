const { Schema, model, Types: { ObjectId } } = require('mongoose');

const Cart = new Schema({
  userId: { type: ObjectId, unique: true, required: true },
  products: [
    {
      productId: { type: String, unique: true, required: true },
      productName: { type: String, unique: false, required: true },
      description: { type: String, unique: false, required: true },
      price: { type: Number, unique: false, required: true },
      image: {
        name: { type: String, unique: false, required: true },
        newName: { type: String, unique: true, required: true },
        url: { type: String, unique: false, required: true },
      },
      quantity: { type: Number, unique: false, required: true },
    },
  ],
});

module.exports = model('Cart', Cart);
