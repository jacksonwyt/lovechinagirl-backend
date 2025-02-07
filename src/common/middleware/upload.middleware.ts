//src/common/middleware/upload.middleware.ts

import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { AwsCredentialIdentity } from "@aws-sdk/types";

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const logger = new Logger('UploadMiddleware');

// File signatures for validation
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

// Validate file extension
const validateFileExtension = (filename: string): boolean => {
  const ext = extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
};

// Validate file content using magic numbers
const validateFileContent = async (file: Express.Multer.File): Promise<boolean> => {
  if (!file?.buffer || file.buffer.length < 8) {
    logger.warn(`Invalid buffer for file: ${file.originalname}`);
    return false;
  }

  const signature = file.buffer.slice(0, 8);
  const expectedSignatures = FILE_SIGNATURES[file.mimetype];

  if (!expectedSignatures) {
    logger.warn(`No signature defined for mimetype: ${file.mimetype}`);
    return false;
  }

  if (Array.isArray(expectedSignatures)) {
    return expectedSignatures.some(sig => 
      signature.slice(0, sig.length).equals(sig)
    );
  }

  return signature.slice(0, expectedSignatures.length).equals(expectedSignatures);
};

// Sanitize filename
const sanitizeFilename = (filename: string): string => {
  const sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-');
  
  const ext = extname(sanitized);
  const base = sanitized.slice(0, sanitized.length - ext.length);
  return `${base.slice(0, 32)}${ext}`; // Limit filename length
};

// Initialize S3 client
const s3Client = process.env.NODE_ENV === 'production'
  ? new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!,
      } as AwsCredentialIdentity,
    })
  : null;

// Storage configuration
export const storage = process.env.NODE_ENV === 'production'
  ? memoryStorage()
  : diskStorage({
      destination: './uploads',
      filename: (req: Request, file: Express.Multer.File, cb: Function) => {
        const sanitizedName = sanitizeFilename(file.originalname);
        const uniqueId = uuidv4();
        cb(null, `${uniqueId}-${sanitizedName}`);
      },
    });

// File filter middleware
export const fileFilter = async (req: Request, file: Express.Multer.File, cb: Function) => {
  logger.debug(`Processing file: ${file.originalname} (${file.mimetype})`);

  try {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new HttpException(
        `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate extension
    if (!validateFileExtension(file.originalname)) {
      throw new HttpException(
        `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate file size
    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new HttpException(
        `File size too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate content
    const isValid = await validateFileContent(file);
    if (!isValid) {
      logger.warn(`Content validation failed for file: ${file.originalname}`);
      throw new HttpException('Invalid file content', HttpStatus.BAD_REQUEST);
    }

    cb(null, true);
  } catch (error) {
    logger.error(`File validation failed: ${error.message}`, error.stack);
    cb(error, false);
  }
};

// S3 upload function
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  try {
    const sanitizedName = sanitizeFilename(file.originalname);
    const key = `uploads/${Date.now()}-${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
      ContentDisposition: 'inline',
    });

    await s3Client.send(command);
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    logger.error('S3 upload failed:', error);
    throw new HttpException('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// Delete file from S3
export const deleteFromS3 = async (url: string): Promise<void> => {
  if (!s3Client) return;

  try {
    const key = url.split('.amazonaws.com/')[1];
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error('S3 deletion failed:', error);
    throw new HttpException('Failed to delete file', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// Multer config
export const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max number of files per upload
  },
};

