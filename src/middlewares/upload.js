const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const DATA_DIR = path.join(__dirname, '../../data');
    const userId = req.body.userId || 1;
    const userDir = path.join(DATA_DIR, `user_${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: function(req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only csv, xlsx, xls, json
  const fileTypes = /csv|excel|spreadsheetml|json/;
  const mimetype = fileTypes.test(file.mimetype);
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: Only CSV, Excel, and JSON files are allowed!'));
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

module.exports = upload;
