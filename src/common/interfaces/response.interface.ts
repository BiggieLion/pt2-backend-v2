export interface CustomResponse {
  statusCode: number;
  success: boolean;
  timestamp: string;
  path: string;
  action: 'CONTINUE' | 'CANCEL';
  message: string;
  data: any;
}

export interface DataResponse {
  data: any;
  message?: string;
}
