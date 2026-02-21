import dotenv from 'dotenv';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import logger from '@utils/logger';

dotenv.config();

const r2Endpoint = process.env.R2_ENDPOINT ?? '';
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID ?? '';
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? '';
const r2Bucket = process.env.R2_BUCKET_NAME ?? '';
const r2Url = process.env.R2_URL ?? '';

export type uploadFile = {
  file_key: string;
  file_path: string;
  file_mime: string;
  file_size: string | number;
  file_name: string;
};

export function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey
    }
  });
}

export async function createOrUpdateFile(key: string, file: Express.Multer.File) {
  return await uploadFile(key, file);
}

export async function getPublicUrl(key: string) {
  return `${r2Url}/${key}`;
}

export async function deleteFile(key: string | any) {
  if (!key) {
    return;
  }

  const client = getClient();
  return await client.send(
    new DeleteObjectCommand({
      Bucket: r2Bucket,
      Key: key
    })
  );
}

export async function uploadFile(key: string | any, file: Express.Multer.File) {
  const client = getClient();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );
  } catch (err) {
    logger.error('Error uploading file.', err);
    return;
  }

  const path = getPublicUrl(key);

  return {
    file_key: key,
    file_path: path,
    file_mime: file.mimetype,
    file_size: file.size,
    file_name: file.originalname
  };
}
