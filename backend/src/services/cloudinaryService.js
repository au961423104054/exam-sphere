const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return !!(name && key && secret && !name.includes('your_') && !key.includes('your_'));
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

/**
 * Upload a webcam snapshot image to Cloudinary (or local storage fallback if unconfigured)
 * @param {Buffer|string} fileInput - Buffer or Base64 string
 * @param {Object} options - { filename, folder }
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadSnapshot = async (fileInput, options = {}) => {
  const folder = options.folder || 'examsphere/proctoring/snapshots';
  const filename = options.filename || `snapshot_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        public_id: filename,
        resource_type: 'image'
      };

      if (Buffer.isBuffer(fileInput)) {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        });
        stream.end(fileInput);
      } else {
        cloudinary.uploader.upload(fileInput, uploadOptions, (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        });
      }
    });
  }

  // Graceful fallback for local development / testing before credentials are provided
  const uploadsDir = path.join(__dirname, '../../uploads/snapshots');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, `${filename}.jpg`);
  if (Buffer.isBuffer(fileInput)) {
    fs.writeFileSync(filePath, fileInput);
  } else if (typeof fileInput === 'string') {
    const base64Data = fileInput.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  }

  const mockCloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'examsphere'}/image/upload/v${Date.now()}/${folder}/${filename}.jpg`;

  return {
    url: mockCloudinaryUrl,
    publicId: `${folder}/${filename}`,
    localPath: filePath
  };
};

module.exports = {
  uploadSnapshot,
  isCloudinaryConfigured
};
