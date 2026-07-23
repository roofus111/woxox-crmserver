const { S3Client } = require('@aws-sdk/client-s3');

// Lazy/safe client — do not crash the whole API when AWS is not configured
const region = process.env.AWS_REGION || 'us-east-1';
const hasCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const s3Client = new S3Client(
  hasCreds
    ? {
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : { region }
);

module.exports = s3Client;
