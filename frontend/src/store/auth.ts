import { create } from 'zustand';

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  orgName?: string;
}

export const UserRoleLabels: Record<string, string> = {
  research_center: '研究中心',
  customs_officer: '报关专员',
  central_lab: '中心实验室',
  admin: '系统管理员',
};

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  setUser: (user: UserInfo) => void;
}

const getStoredToken = () => localStorage.getItem('token');
const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getStoredToken(),
  user: getStoredUser(),
  isAuthenticated: !!getStoredToken(),

  login: (token: string, user: UserInfo) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user: UserInfo) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
