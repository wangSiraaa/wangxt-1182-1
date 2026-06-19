import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;

    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        message.error(data.message || '操作失败');
        return Promise.reject(new Error(data.message || '操作失败'));
      }
      return data;
    }

    return data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('权限不足，禁止访问');
      } else if (status === 404) {
        message.error('请求的资源不存在');
      } else if (status === 500) {
        message.error('服务器内部错误');
      } else if (data && data.message) {
        message.error(data.message);
      } else {
        message.error('网络请求失败');
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络');
    } else {
      message.error(error.message || '请求失败');
    }

    return Promise.reject(error);
  }
);

export interface ApiResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  page?: number;
  pageSize?: number;
}

export const api = {
  get: <T = any>(url: string, params?: any): Promise<ApiResult<T>> =>
    instance.get(url, { params }),
  post: <T = any>(url: string, data?: any): Promise<ApiResult<T>> =>
    instance.post(url, data),
  put: <T = any>(url: string, data?: any): Promise<ApiResult<T>> =>
    instance.put(url, data),
  delete: <T = any>(url: string): Promise<ApiResult<T>> =>
    instance.delete(url),
};

export default instance;
