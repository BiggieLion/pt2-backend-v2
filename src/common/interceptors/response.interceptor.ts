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
import { ResponseAction } from '../enums/response-action.enum';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<CustomResponse> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();
    const { statusCode } = res;

    return next.handle().pipe(
      map((payload: unknown): CustomResponse => {
        const isRecord = (v: unknown): v is Record<string, unknown> =>
          typeof v === 'object' && v !== null;
        const isDataResponse = (v: unknown): v is DataResponse =>
          isRecord(v) && 'data' in v;

        let message = 'Request completed';
        let data: unknown = payload;
        if (isDataResponse(payload)) {
          data = payload.data;
          if (typeof payload.message === 'string') {
            message = payload.message;
          }
        }

        return {
          statusCode,
          success: statusCode < 400,
          timestamp: new Date().toISOString(),
          path: req.url,
          action:
            statusCode >= 400 ? ResponseAction.CANCEL : ResponseAction.CONTINUE,
          message,
          version: '2.0.0',
          data: data ?? {},
        };
      }),

      catchError((err: unknown) => {
        const errorStatusCode: number =
          err instanceof HttpException ? err.getStatus() : 500;
        const isProduction = process.env.NODE_ENV === 'production';

        // Derive a safe error message without unsafe member access
        let derivedMessage = 'Internal server error';
        if (err instanceof HttpException) {
          const resp = err.getResponse();
          if (typeof resp === 'string') {
            derivedMessage = resp;
          } else if (resp && typeof resp === 'object') {
            const maybeMsg = (resp as { message?: unknown }).message;
            if (typeof maybeMsg === 'string') {
              derivedMessage = maybeMsg;
            } else if (Array.isArray(maybeMsg)) {
              derivedMessage = maybeMsg.join(', ');
            } else if (typeof err.message === 'string') {
              derivedMessage = err.message;
            }
          } else if (typeof err.message === 'string') {
            derivedMessage = err.message;
          }
        } else if (!isProduction) {
          // Only expose unknown error details outside production
          if (typeof err === 'string') {
            derivedMessage = err;
          } else if (
            typeof err === 'object' &&
            err !== null &&
            'message' in err &&
            typeof (err as { message?: unknown }).message === 'string'
          ) {
            derivedMessage = (err as { message: string }).message;
          }
        }

        const errorResponse: CustomResponse = {
          statusCode: errorStatusCode,
          success: false,
          timestamp: new Date().toISOString(),
          path: req.url,
          action: ResponseAction.CANCEL,
          message: derivedMessage,
          version: '2.0.0',
          data: {},
        };

        return throwError(
          () => new HttpException(errorResponse, errorStatusCode),
        );
      }),
    );
  }
}
