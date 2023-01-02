const util = require('util');
const multer = require('multer');

const maxSize = 2 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/home/user/shopLamp/LampShopBack/public');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname.replace(/ /g, '_')}`);
  },
});

const fileFilter = (req, file, cb) => {
  const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
  if (validTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadFile = multer({
  storage,
  limits: { fieldSize: maxSize },
  fileFilter,
}).single('file');

const uploadFileMiddleWare = util.promisify(uploadFile);

module.exports = uploadFileMiddleWare;
