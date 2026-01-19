import axios from 'axios';
import type {
  ProfileUpdateData,
  LeadCreateData,
  LeadUpdateData,
  CampaignCreateData,
  DataSourceCreateData,
  IntegrationCreateData,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  register: (data: { email: string; password: string; name: string; company_name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Profile
export const profile = {
  get: () => api.get('/profile'),
  update: (data: ProfileUpdateData) => api.put('/profile', data),
};

// Leads
export const leads = {
  list: (params?: { page?: number; status?: string; industry?: string; min_score?: number; search?: string }) =>
    api.get('/leads', { params }),
  get: (id: string) => api.get(`/leads/${id}`),
  create: (data: LeadCreateData) => api.post('/leads', data),
  update: (id: string, data: LeadUpdateData) => api.put(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Campaigns
export const campaigns = {
  list: () => api.get('/campaigns'),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: CampaignCreateData) => api.post('/campaigns', data),
  update: (id: string, data: Partial<CampaignCreateData>) => api.put(`/campaigns/${id}`, data),
  start: (id: string) => api.post(`/campaigns/${id}/start`),
  pause: (id: string) => api.post(`/campaigns/${id}/pause`),
};

// Sources
export const sources = {
  listIndustries: () => api.get('/sources/industries'),
  list: () => api.get('/sources'),
  create: (data: DataSourceCreateData) => api.post('/sources', data),
  enableIndustry: (id: string) => api.post(`/sources/industries/${id}/enable`),
};

// Integrations
export const integrations = {
  list: () => api.get('/integrations'),
  create: (data: IntegrationCreateData) => api.post('/integrations', data),
  delete: (id: string) => api.delete(`/integrations/${id}`),
};

// Dashboard
export const dashboard = {
  stats: () => api.get('/dashboard/stats'),
  activity: () => api.get('/dashboard/activity'),
};

// AI
export const ai = {
  generateMessage: (data: { lead_id: string; channel: string; custom_context?: string }) =>
    api.post('/ai/generate-message', data),
  scoreLead: (lead_id: string) =>
    api.post('/ai/score-lead', { lead_id }),
  analyzeResponse: (message: string, context?: string) =>
    api.post('/ai/analyze-response', { message, context }),
};

export default api;
