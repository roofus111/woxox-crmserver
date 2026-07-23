const fs = require('fs');
const path = require('path');
const os = require('os');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Prefer /tmp so the non-root container user can always write without rebuild
const UPLOAD_ROOT =
  process.env.CHAT_UPLOAD_DIR ||
  path.join(os.tmpdir(), 'woxox-uploads', 'chat');

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

function getPublicApiBase() {
  const raw =
    process.env.PUBLIC_API_URL ||
    process.env.API_ORIGIN ||
    process.env.CORS_ORIGIN ||
    '';
  return String(raw).replace(/\/$/, '');
}

function hasS3Config() {
  const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      bucket
  );
}

async function uploadLocal(fileData) {
  ensureUploadDir();
  const name = fileData.name || fileData.originalname || `file-${Date.now()}`;
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${safeName}`;
  const buffer = fileData.buffer || fileData;
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid file buffer for local upload');
  }
  const dest = path.join(UPLOAD_ROOT, filename);
  await fs.promises.writeFile(dest, buffer);

  const base = getPublicApiBase();
  if (base) return `${base}/uploads/chat/${filename}`;
  return `/uploads/chat/${filename}`;
}

async function uploadFileToS3(fileData) {
  if (!hasS3Config()) {
    console.warn('AWS S3 not configured — storing chat file on local disk');
    return uploadLocal(fileData);
  }

  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
  const name = fileData.name || fileData.originalname || 'file';
  const buffer = fileData.buffer || fileData;
  const contentType = fileData.type || fileData.mimetype || 'application/octet-stream';

  const key = `chat-files/${Date.now()}-${name}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `https://${bucket}.s3.amazonaws.com/${key}`;
}

module.exports = { uploadFileToS3, uploadLocal, hasS3Config, UPLOAD_ROOT };
