// error.middleware.ts - Update the catch method
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
 private readonly logger = new Logger('GlobalExceptionFilter');

 catch(exception: unknown, host: ArgumentsHost) {
   const ctx = host.switchToHttp();
   const response = ctx.getResponse<Response>();
   const request = ctx.getRequest<Request>();
   
   const status = 
     exception instanceof HttpException
       ? exception.getStatus()
       : HttpStatus.INTERNAL_SERVER_ERROR;

   const errorResponse = {
     statusCode: status,
     timestamp: new Date().toISOString(),
     path: request.url,
     method: request.method,
     message: exception instanceof HttpException 
       ? exception.message
       : 'Internal server error',
     ...(process.env.NODE_ENV !== 'production' && { 
       stack: exception instanceof Error ? exception.stack : undefined 
     })
   };

   this.logger.error(
     `${request.method} ${request.url}`,
     exception instanceof Error ? exception.stack : undefined,
     'GlobalExceptionFilter'
   );

   response.status(status).json({
     statusCode: status,
     message: errorResponse.message
   });
 }
}