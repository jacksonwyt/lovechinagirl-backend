import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AwsCredentialIdentity } from "@aws-sdk/types";

const logger = new Logger('UploadMiddleware');

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const FILE_SIGNATURES = {
  'image/jpeg': [
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE2]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE8])
  ],
  'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46])
};

const validateFileContent = async (file: Express.Multer.File): Promise<boolean> => {
  if (!file?.buffer || file.buffer.length < 8) {
    logger.warn(`Invalid buffer for file: ${file.originalname}`);
    return false;
  }

  const signature = file.buffer.slice(0, 8);
  let isValid = false;

  for (const signatures of Object.values(FILE_SIGNATURES)) {
    if (Array.isArray(signatures)) {
      for (const sig of signatures) {
        if (signature.slice(0, sig.length).equals(sig)) {
          isValid = true;
          break;
        }
      }
    } else if (signature.slice(0, signatures.length).equals(signatures)) {
      isValid = true;
    }
    if (isValid) break;
  }

  if (!isValid) {
    logger.warn(`Content validation failed for file: ${file.originalname}`);
  }
  return isValid;
};

const s3Client = process.env.NODE_ENV === 'production'
  ? new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!,
      } as AwsCredentialIdentity,
    })
  : null;

export const storage = process.env.NODE_ENV === 'production'
  ? memoryStorage()
  : diskStorage({
      destination: './uploads',
      filename: (_req: Request, file: Express.Multer.File, cb: Function) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    });

export const fileFilter = async (req: Request, file: Express.Multer.File, cb: Function) => {
  logger.debug(`Processing file: ${file.originalname} (${file.mimetype})`);
  cb(null, true);
};

export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  try {
    const key = `uploads/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await s3Client.send(command);
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    logger.error('S3 upload failed:', error);
    throw new HttpException('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

export const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },
};

