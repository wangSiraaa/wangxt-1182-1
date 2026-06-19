import { Op, FindOptions } from 'sequelize';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const getPaginationParams = (query: any): { page: number; pageSize: number; offset: number; limit: number } => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize || '10', 10), 1), 100);
  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  return { page, pageSize, offset, limit };
};

export const applyPagination = <T>(options: FindOptions, query: any): FindOptions => {
  const { offset, limit } = getPaginationParams(query);
  return {
    ...options,
    offset,
    limit,
  };
};

export const buildPaginationResult = <T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number
): PaginationResult<T> => {
  return {
    list,
    total,
    page,
    pageSize,
  };
};

export const buildSearchCondition = (
  keyword?: string,
  fields: string[] = []
): Record<string, any> => {
  if (!keyword || fields.length === 0) return {} as Record<string, any>;

  return {
    [Op.or]: fields.map((field) => ({
      [field]: {
        [Op.iLike]: `%${keyword}%`,
      },
    })),
  };
};
