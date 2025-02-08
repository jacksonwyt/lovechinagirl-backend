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

export const storage = process.env.NODE_ENV === 'production'
  ? memoryStorage()
  : diskStorage({
      destination: './uploads',
      filename: (_req: Request, file: Express.Multer.File, cb: Function) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    });

export const fileFilter = (_req: Request, file: Express.Multer.File, cb: Function) => {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return cb(new Error('File type not allowed'), false);
  }

  const ext = extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('File extension not allowed'), false);
  }

  logger.debug(`Processing file: ${file.originalname} (${file.mimetype})`);
  cb(null, true);
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
      ContentType: file.mimetype
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

