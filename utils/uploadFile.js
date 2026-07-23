const fs = require('fs');
const path = require('path');
const os = require('os');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Prefer /app/uploads (compose volume) then /tmp so non-root can write
const UPLOAD_ROOT =
  process.env.CHAT_UPLOAD_DIR ||
  (fs.existsSync('/app/uploads')
    ? path.join('/app/uploads', 'chat')
    : path.join(os.tmpdir(), 'woxox-uploads', 'chat'));

const DOCS_UPLOAD_ROOT =
  process.env.DOCS_UPLOAD_DIR ||
  (fs.existsSync('/app/uploads')
    ? path.join('/app/uploads', 'fileuploads')
    : path.join(os.tmpdir(), 'woxox-uploads', 'fileuploads'));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function getPublicApiBase() {
  const raw =
    process.env.PUBLIC_API_URL ||
    process.env.API_ORIGIN ||
    process.env.API_BASE_URL ||
    process.env.CORS_ORIGIN ||
    '';
  return String(raw).split(',')[0].trim().replace(/\/$/, '');
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
  ensureDir(UPLOAD_ROOT);
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

/**
 * Store a CRM document (lead/myfiles) on S3 when configured, otherwise local disk.
 * Returns { fileName, fileType, fileUrl }.
 */
async function storeCompanyDocument(file, companyId, keyPrefix = 'fileuploads') {
  const original = file.originalname || file.name || `file-${Date.now()}`;
  const safeName = String(original).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileKey = `${Date.now()}-${safeName}`;
  const buffer = file.buffer;
  const contentType = file.mimetype || file.type || 'application/octet-stream';

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid file buffer for document upload');
  }

  if (hasS3Config()) {
    const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
    const key = `${keyPrefix}/${companyId}/${fileKey}`;
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return {
      fileName: fileKey,
      fileType: contentType,
      fileUrl: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
  }

  const companyDir = path.join(DOCS_UPLOAD_ROOT, String(companyId));
  ensureDir(companyDir);
  await fs.promises.writeFile(path.join(companyDir, fileKey), buffer);
  const base = getPublicApiBase();
  const publicPath = `/uploads/fileuploads/${companyId}/${fileKey}`;
  return {
    fileName: fileKey,
    fileType: contentType,
    fileUrl: base ? `${base}${publicPath}` : publicPath,
  };
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

module.exports = {
  uploadFileToS3,
  uploadLocal,
  storeCompanyDocument,
  hasS3Config,
  UPLOAD_ROOT,
  DOCS_UPLOAD_ROOT,
};
