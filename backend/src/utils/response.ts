import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  page?: number;
  pageSize?: number;
}

export const successResponse = <T>(
  res: Response,
  data?: T,
  message: string = '操作成功',
  pagination?: { total: number; page: number; pageSize: number }
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    response.total = pagination.total;
    response.page = pagination.page;
    response.pageSize = pagination.pageSize;
  }

  return res.json(response);
};

export const errorResponse = (
  res: Response,
  message: string = '操作失败',
  statusCode: number = 400,
  errors?: any[]
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
