import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth as authApi } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  org_id: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          const { access_token, user } = response.data;
          
          localStorage.setItem('token', access_token);
          set({ user, token: access_token, isLoading: false });
        } catch (error: unknown) {
          const apiError = error as { response?: { data?: { detail?: string } } };
          set({
            error: apiError.response?.data?.detail || 'فشل تسجيل الدخول',
            isLoading: false
          });
          throw error;
        }
      },
      
      register: async (email, password, name, companyName) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({ 
            email, 
            password, 
            name, 
            company_name: companyName 
          });
          const { access_token, user } = response.data;
          
          localStorage.setItem('token', access_token);
          set({ user, token: access_token, isLoading: false });
        } catch (error: unknown) {
          const apiError = error as { response?: { data?: { detail?: string } } };
          set({
            error: apiError.response?.data?.detail || 'فشل إنشاء الحساب',
            isLoading: false
          });
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ user: null, token: null });
          return;
        }
        
        try {
          const response = await authApi.me();
          set({ user: response.data, token });
        } catch {
          localStorage.removeItem('token');
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'faris-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
