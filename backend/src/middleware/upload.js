const multer = require('multer');

const storage = multer.memoryStorage();

// Image upload for webcam snapshots
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for webcam snapshots'), false);
    }
  }
});

// File upload for question banks (JSON, CSV, TXT)
const uploadBank = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for large question banks
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/json',
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];
    const isJsonOrCsv =
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith('.json') ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.txt');

    if (isJsonOrCsv) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON or CSV files are allowed for question bank imports'), false);
    }
  }
});

module.exports = upload;
module.exports.uploadBank = uploadBank;
