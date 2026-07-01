const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const s3Client = require('../../../config/s3');
const EmailAttachment = require('../models/EmailAttachment');
const SettingsService = require('./SettingsService');

async function getS3Client(companyId) {
  const creds = await SettingsService.getDecryptedCredentials(companyId);
  if (creds?.s3?.accessKey && creds?.s3?.secretKey && creds?.s3?.bucket) {
    return {
      client: new S3Client({
        region: creds.s3.region || 'us-east-1',
        credentials: {
          accessKeyId: creds.s3.accessKey,
          secretAccessKey: creds.s3.secretKey,
        },
      }),
      bucket: creds.s3.bucket,
      region: creds.s3.region || 'us-east-1',
    };
  }
  return {
    client: s3Client,
    bucket: process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION || 'us-east-1',
  };
}

async function uploadAttachment(companyId, userId, file) {
  const { client, bucket, region } = await getS3Client(companyId);
  if (!bucket) throw new Error('S3 bucket not configured. Add credentials in Email Settings.');

  const key = `email-attachments/${companyId}/${uuidv4()}-${file.originalname}`;

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return EmailAttachment.create({
    company: companyId,
    filename: key.split('/').pop(),
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    s3Key: key,
    s3Url: url,
    virusScanStatus: 'skipped',
    uploadedBy: userId,
  });
}

async function getAttachment(companyId, id) {
  return EmailAttachment.findOne({ _id: id, company: companyId });
}

module.exports = { uploadAttachment, getAttachment, getS3Client };
