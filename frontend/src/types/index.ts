// API Types for Faris AI SaaS

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  org_id: string;
  avatar_url?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  org_id: string;
  company_name: string;
  company_name_ar?: string;
  website?: string;
  industry?: string;
  contact_name?: string;
  contact_title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  funding_amount?: string;
  funding_stage?: string;
  employee_count?: string;
  location?: string;
  source_id?: string;
  source_url?: string;
  raw_data?: Record<string, unknown>;
  score: number;
  score_breakdown: Record<string, unknown>;
  status: string;
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
}

export interface LeadListResponse {
  leads: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Campaign {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  target_industries: string[];
  target_statuses: string[];
  min_score: number;
  max_leads?: number;
  channels: string[];
  daily_limit: number;
  send_times?: Record<string, unknown>;
  email_subject_template?: string;
  message_template?: string;
  status: string;
  leads_contacted: number;
  replies_received: number;
  meetings_booked: number;
  created_at: string;
  started_at?: string;
  paused_at?: string;
  completed_at?: string;
}

export interface IndustrySource {
  id: string;
  industry: string;
  industry_ar?: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  source_type: string;
  url: string;
  region?: string;
  is_active: boolean;
}

export interface DataSource {
  id: string;
  org_id: string;
  industry_source_id?: string;
  name: string;
  source_type: string;
  url?: string;
  scrape_config: Record<string, unknown>;
  is_active: boolean;
  last_scraped_at?: string;
  last_error?: string;
  leads_count: number;
  created_at: string;
}

export interface CompanyProfile {
  id: string;
  org_id: string;
  company_name?: string;
  company_name_ar?: string;
  industry?: string;
  website?: string;
  value_proposition?: string;
  value_proposition_ar?: string;
  target_audience?: string;
  pain_points: string[];
  differentiators: string[];
  tone?: string;
  language?: string;
  sdr_script?: string;
  sdr_script_ar?: string;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_leads: number;
  leads_this_month: number;
  messages_sent: number;
  replies_received: number;
  reply_rate: number;
  active_campaigns: number;
  leads_by_status: Record<string, number>;
  leads_by_score: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface ProfileUpdateData {
  company_name?: string;
  company_name_ar?: string;
  industry?: string;
  website?: string;
  value_proposition?: string;
  value_proposition_ar?: string;
  target_audience?: string;
  pain_points?: string[];
  differentiators?: string[];
  tone?: string;
  language?: string;
  sdr_script?: string;
  sdr_script_ar?: string;
}

export interface LeadCreateData {
  company_name: string;
  company_name_ar?: string;
  website?: string;
  industry?: string;
  contact_name?: string;
  contact_title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  funding_amount?: string;
  funding_stage?: string;
  employee_count?: string;
  location?: string;
}

export interface LeadUpdateData extends Partial<LeadCreateData> {
  status?: string;
  notes?: string;
  tags?: string[];
}

export interface CampaignCreateData {
  name: string;
  description?: string;
  target_industries?: string[];
  target_statuses?: string[];
  min_score?: number;
  max_leads?: number;
  channels?: string[];
  daily_limit?: number;
  send_times?: Record<string, unknown>;
  email_subject_template?: string;
  message_template?: string;
}

export interface DataSourceCreateData {
  name: string;
  source_type: string;
  url?: string;
  scrape_config?: Record<string, unknown>;
}

export interface IntegrationCreateData {
  type: string;
  name?: string;
  config?: Record<string, unknown>;
  daily_limit?: number;
}

export interface Integration {
  id: string;
  org_id: string;
  type: string;
  name?: string;
  is_active: boolean;
  last_verified_at?: string;
  last_error?: string;
  daily_limit?: number;
  used_today: number;
  created_at: string;
}

// Error type for API responses
export interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
    status?: number;
  };
  message?: string;
}
