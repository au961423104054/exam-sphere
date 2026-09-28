const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const publicBaseUrl = (req) => {
  const customUrl = process.env.API_PUBLIC_URL || process.env.PUBLIC_BASE_URL;
  if (customUrl) {
    return customUrl.replace(/\/+$/, '');
  }
  if (req && req.protocol && req.get) {
    return `${req.protocol}://${req.get('host')}`;
  }
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
};

const decodeImageInput = (fileInput) => {
  if (Buffer.isBuffer(fileInput)) return fileInput;
  if (typeof fileInput === 'string') {
    const base64Data = fileInput.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }
  throw new Error('Unsupported file input for local storage upload');
};

/**
 * Persist webcam snapshots (and optional certificate PDFs) on local disk.
 */
const saveFile = async ({ buffer, folder = 'snapshots', extension = 'jpg', req }) => {
  const destDir = path.join(UPLOAD_ROOT, folder);
  ensureDir(destDir);
  const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${extension}`;
  const filePath = path.join(destDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  const relativePath = `${folder}/${filename}`;
  return {
    url: `${publicBaseUrl(req)}/uploads/${relativePath}`,
    publicId: relativePath,
    localPath: filePath
  };
};

const uploadSnapshot = async (fileInput, options = {}) => {
  const buffer = decodeImageInput(fileInput);
  return saveFile({
    buffer,
    folder: options.folder || 'snapshots',
    extension: 'jpg',
    req: options.req
  });
};

const saveCertificatePdf = async (pdfBuffer, options = {}) => {
  return saveFile({
    buffer: pdfBuffer,
    folder: 'certificates',
    extension: 'pdf',
    req: options.req
  });
};

module.exports = {
  uploadSnapshot,
  saveCertificatePdf,
  publicBaseUrl,
  UPLOAD_ROOT
};
