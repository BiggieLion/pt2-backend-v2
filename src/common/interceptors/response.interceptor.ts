import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, map, Observable, throwError } from 'rxjs';
import { DataResponse, CustomResponse } from '../interfaces';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();
    const { statusCode } = res;

    return next.handle().pipe(
      map(
        (data: DataResponse): CustomResponse => ({
          statusCode,
          success: statusCode < 400,
          timestamp: Date.now(),
          path: req.url,
          action: statusCode >= 400 ? 'CANCEL' : 'CONTINUE',
          message: data?.message || 'Request completed',
          data: data.data || {},
        }),
      ),

      catchError((error) => {
        const statusCode: number =
          error instanceof HttpException ? error.getStatus() : 500;

        const errorResponse = {
          statusCode,
          success: false,
          timestamp: Date.now(),
          path: req.url,
          action: 'CANCEL',
          message:
            error.message ||
            error?.response?.message ||
            'Internal server error',
          data: {},
        };

        return throwError(() => new HttpException(errorResponse, statusCode));
      }),
    );
  }
}
