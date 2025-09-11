export interface IResponse {
  statusCode: number;
  success: boolean;
  timestamp: number;
  path: string;
  action: 'CONTINUE' | 'CANCEL';
  message: string;
  data: any;
}

export interface IDataResponse {
  data: any;
  message?: string;
}
