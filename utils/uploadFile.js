const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadFileToS3(fileData) {
  const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
  const name = fileData.name || fileData.originalname || 'file';
  const buffer = fileData.buffer || fileData;
  const contentType = fileData.type || fileData.mimetype || 'application/octet-stream';

  const key = `chat-files/${Date.now()}-${name}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `https://${bucket}.s3.amazonaws.com/${key}`;
}

module.exports = { uploadFileToS3 };
