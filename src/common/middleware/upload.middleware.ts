//src/common/middleware/upload.middleware.ts

import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { Buffer } from 'buffer';
import { lookup } from 'mime-types';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const FILE_SIGNATURES = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46])
};

const validateFileContent = async (file: Express.Multer.File): Promise<boolean> => {
  // Guard: if buffer is missing or too short, return false
  if (!file?.buffer || file.buffer.length < 4) {
    return false;
  }

  const signature = file.buffer.slice(0, 4);  
  const detectedType = lookup(file.originalname);

  // Compare the known signature for the mimetype
  const expectedSignature = FILE_SIGNATURES[file.mimetype];
  if (!expectedSignature) {
    return false;
  }

  // Check if the file’s signature matches
  const correctSignature = expectedSignature.equals(signature.slice(0, expectedSignature.length));
  // Check if the extension-based detection (lookup) matches the actual mimetype
  const correctType = detectedType === file.mimetype;

  return correctSignature && correctType;
};

const sanitizeFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
};

// Create S3 client only in production
const s3Client = process.env.NODE_ENV === 'production'
  ? new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!,
      } as AwsCredentialIdentity,
    })
  : null;

// If not in production, use disk storage for local file saving
export const storage = process.env.NODE_ENV === 'production'
  ? undefined // memory storage (default) for S3
  : diskStorage({
      destination: './uploads',
      filename: (req: Request, file: Express.Multer.File, cb: Function) => {
        const sanitizedName = sanitizeFilename(file.originalname);
        const fileExtension = extname(file.originalname).toLowerCase();
        const uniqueId = uuidv4();
        cb(null, `${uniqueId}-${sanitizedName}${fileExtension}`);
      },
    });

export const fileFilter = async (req: Request, file: Express.Multer.File, cb: Function) => {
  console.log('Incoming file:', file.mimetype, file.originalname, file.size);
  try {
    // Check if the file’s mimetype is allowed
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new HttpException(
        `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new HttpException(
        `File size too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate actual file signature to prevent “fake” files
    const isValid = await validateFileContent(file);
    if (!isValid) {
      throw new HttpException('Invalid file content', HttpStatus.BAD_REQUEST);
    }

    // All checks passed
    cb(null, true);
  } catch (error) {
    // Return error to Multer
    cb(error, false);
  }
};

export const uploadToS3 = async (file: Express.Multer.File): Promise<string | null> => {
  if (!s3Client) return null;

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
    console.error('S3 upload error:', error);
    throw new HttpException('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// Config object for Multer
export const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },
};

