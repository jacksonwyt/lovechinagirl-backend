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
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const FILE_SIGNATURES = {
 'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
 'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47]),
 'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46])
};

const validateFileContent = async (file: Express.Multer.File): Promise<boolean> => {
 const buffer = file.buffer;
 const signature = buffer.slice(0, 4);
 const detectedType = lookup(file.originalname);
 
 return FILE_SIGNATURES[file.mimetype]?.equals(signature.slice(0, FILE_SIGNATURES[file.mimetype].length)) 
   && detectedType === file.mimetype;
};

const sanitizeFilename = (filename: string): string => {
 return filename
   .toLowerCase()
   .replace(/[^a-z0-9]/g, '-')
   .replace(/-+/g, '-');
};

const s3Client = process.env.NODE_ENV === 'production' ? new S3Client({
 region: process.env.AWS_REGION!,
 credentials: {
   accessKeyId: process.env.AWS_ACCESS_KEY!,
   secretAccessKey: process.env.AWS_SECRET_KEY!
 } as AwsCredentialIdentity
}) : null;

export const storage = process.env.NODE_ENV === 'production' 
 ? undefined  // Use memory storage for S3
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
 try {
   if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
     throw new HttpException(
       `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
       HttpStatus.BAD_REQUEST
     );
   }

   if (file.size > MAX_FILE_SIZE) {
     throw new HttpException(
       `File size too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
       HttpStatus.BAD_REQUEST
     );
   }

   const isValid = await validateFileContent(file);
   if (!isValid) {
     throw new HttpException('Invalid file content', HttpStatus.BAD_REQUEST);
   }

   cb(null, true);
 } catch (error) {
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
     ContentDisposition: 'inline'
   });

   await s3Client.send(command);
   return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
 } catch (error) {
   console.error('S3 upload error:', error);
   throw new HttpException('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR);
 }
};

export const multerConfig = {
 storage,
 fileFilter,
 limits: {
   fileSize: MAX_FILE_SIZE,
   files: 10
 }
};
