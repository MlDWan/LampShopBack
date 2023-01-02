const Router = require('express');

const Product = require('../models/product_model');
const uploadFile = require('../middleware/upload_middleware');
const checkAuth = require('../middleware/check_authentication_middleware');

const router = new Router();

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();

    res.send(products);
  } catch (error) {
    res.status(400).json({ message: 'Unable to get product list', error });
  }
});

router.get('/:_id', async (req, res) => {
  try {
    const { _id } = req.params;
    const newId = _id.trim();

    if (newId) {
      Product.findById(newId)
        .then((data) => {
          res.send(data);
        })
        .catch(() => {
          res.send('Incorrect id');
        });
    } else {
      res.status(400).send('Incorrect id');
    }
  } catch (error) {
    res.status(404).json({ message: 'Product not found', error });
  }
});

router.patch('/change/:_id', checkAuth, uploadFile, async (req, res) => {
  try {
    const { _id } = req.params;
    const newId = _id.trim();
    const { file } = req;
    const {
      body: {
        amount,
        price,
        productName,
        description,
      },
    } = req;

    if (newId) {
      if (req.body) {
        const newProductName = productName?.trim();
        const newDescription = description?.trim();
        const newAmount = +amount;
        const newPrice = +price;

        const changedProduct = {
          amount: newAmount || 0,
          price: newPrice || 0,
          description: newDescription || undefined,
          productName: newProductName || undefined,
        };

        if (file) {
          changedProduct.image = {
            name: file?.originalname,
            newName: file?.filename,
            url: file?.path,
          };
        }

        await Product.updateOne({ _id: newId }, changedProduct);
        const modifiedProduct = await Product.findById({ _id: newId });

        res.send(modifiedProduct);
      } else {
        const product = await Product.findById(_id);

        res.send(product);
      }
    } else {
      res.send('Incorrect id');
    }
  } catch (error) {
    res.send(error);
  }
});

router.delete('/delete/:_id', checkAuth, async (req, res) => {
  try {
    let { _id } = req.params;
    _id = _id.trim();

    if (_id) {
      const product = await Product.findById({ _id });
      if (product) {
        await Product.deleteOne({ _id }).then(() => {
          res.send('Product deleted successfully');
        });
      } else {
        res.send('Product not found');
      }
    } else {
      res.status(400).send('Incorrect id');
    }
  } catch (error) {
    res.status(400).json({ message: 'Error when deleting item', error });
  }
});

router.post('/create', uploadFile, async (req, res) => {
  try {
    const { file } = req;
    const {
      body: {
        productName,
        price,
        description,
        amount,
      },
    } = req;

    const newProductName = productName.trim();
    const newDescription = description.trim();
    const newPrice = +price;
    const newAmount = +amount;

    if (newDescription && newPrice && newAmount && file && newProductName) {
      const image = {
        name: file.originalname,
        newName: file.filename,
        url: file.path,
      };
      const product = {
        productName: newProductName,
        price: newPrice,
        amount: newAmount,
        description: newDescription,
        image,
      };

      await Product.create(product).then(() => {
        res.send('Product added');
      });
    } else {
      res.status(400).send('Incorrect data');
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: 'Check the correctness of the entered data', error });
  }
});

module.exports = router;
