/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export class ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: any;

  constructor(statusCode: number, message: string, data: T, meta?: any) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success<T>(message: string, data: T, meta?: any): ApiResponse<T> {
    return new ApiResponse(200, message, data, meta);
  }

  static created<T>(message: string, data: T): ApiResponse<T> {
    return new ApiResponse(201, message, data);
  }
}
