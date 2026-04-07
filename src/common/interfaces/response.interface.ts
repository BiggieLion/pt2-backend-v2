import { ResponseAction } from '../enums/response-action.enum';

export interface CustomResponse {
  statusCode: number;
  success: boolean;
  timestamp: string;
  path: string;
  action: ResponseAction;
  message: string;
  version: string;
  data: unknown;
}

export interface DataResponse {
  data: unknown;
  message?: string;
}
