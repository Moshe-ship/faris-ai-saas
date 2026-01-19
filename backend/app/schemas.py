"""
Pydantic Schemas for Faris AI SaaS API
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
from uuid import UUID


# ==================== ENUMS ====================

class UserRole(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class LeadStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    replied = "replied"
    meeting_scheduled = "meeting_scheduled"
    converted = "converted"
    not_interested = "not_interested"
    archived = "archived"


class CampaignStatus(str, Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    completed = "completed"


class MessageStatus(str, Enum):
    draft = "draft"
    scheduled = "scheduled"
    sending = "sending"
    sent = "sent"
    delivered = "delivered"
    opened = "opened"
    clicked = "clicked"
    replied = "replied"
    bounced = "bounced"
    failed = "failed"


class Channel(str, Enum):
    email = "email"
    linkedin = "linkedin"
    whatsapp = "whatsapp"


class Tone(str, Enum):
    professional = "professional"
    casual = "casual"
    formal = "formal"
    friendly = "friendly"


class Language(str, Enum):
    ar = "ar"
    en = "en"
    mixed = "mixed"


class SourceType(str, Enum):
    website = "website"
    rss = "rss"
    api = "api"
    csv_upload = "csv_upload"


# ==================== AUTH SCHEMAS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str
    company_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    org_id: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# ==================== COMPANY PROFILE SCHEMAS ====================

class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    company_name_ar: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    value_proposition: Optional[str] = None
    value_proposition_ar: Optional[str] = None
    target_audience: Optional[str] = None
    pain_points: Optional[List[str]] = None
    differentiators: Optional[List[str]] = None
    tone: Optional[Tone] = None
    language: Optional[Language] = None
    sdr_script: Optional[str] = None
    sdr_script_ar: Optional[str] = None


class CompanyProfileResponse(BaseModel):
    id: str
    org_id: str
    company_name: Optional[str] = None
    company_name_ar: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    value_proposition: Optional[str] = None
    value_proposition_ar: Optional[str] = None
    target_audience: Optional[str] = None
    pain_points: List[str] = []
    differentiators: List[str] = []
    tone: Optional[str] = None
    language: Optional[str] = None
    sdr_script: Optional[str] = None
    sdr_script_ar: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


# ==================== LEAD SCHEMAS ====================

class LeadCreate(BaseModel):
    company_name: str
    company_name_ar: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    funding_amount: Optional[str] = None
    funding_stage: Optional[str] = None
    employee_count: Optional[str] = None
    location: Optional[str] = None


class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    company_name_ar: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    funding_amount: Optional[str] = None
    funding_stage: Optional[str] = None
    employee_count: Optional[str] = None
    location: Optional[str] = None
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class LeadResponse(BaseModel):
    id: str
    org_id: str
    company_name: str
    company_name_ar: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    funding_amount: Optional[str] = None
    funding_stage: Optional[str] = None
    employee_count: Optional[str] = None
    location: Optional[str] = None
    source_id: Optional[str] = None
    source_url: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    score: int = 0
    score_breakdown: Dict[str, Any] = {}
    status: str = "new"
    notes: Optional[str] = None
    tags: List[str] = []
    created_at: str
    updated_at: Optional[str] = None


class LeadListResponse(BaseModel):
    leads: List[LeadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==================== CAMPAIGN SCHEMAS ====================

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_industries: Optional[List[str]] = None
    target_statuses: Optional[List[str]] = None
    min_score: int = 5
    max_leads: Optional[int] = None
    channels: List[Channel] = [Channel.email]
    daily_limit: int = 20
    send_times: Optional[Dict[str, Any]] = None
    email_subject_template: Optional[str] = None
    message_template: Optional[str] = None


class CampaignResponse(BaseModel):
    id: str
    org_id: str
    name: str
    description: Optional[str] = None
    target_industries: List[str] = []
    target_statuses: List[str] = []
    min_score: int = 5
    max_leads: Optional[int] = None
    channels: List[str] = []
    daily_limit: int = 20
    send_times: Optional[Dict[str, Any]] = None
    email_subject_template: Optional[str] = None
    message_template: Optional[str] = None
    status: str = "draft"
    leads_contacted: int = 0
    replies_received: int = 0
    meetings_booked: int = 0
    created_at: str
    started_at: Optional[str] = None
    paused_at: Optional[str] = None
    completed_at: Optional[str] = None


# ==================== DATA SOURCE SCHEMAS ====================

class DataSourceCreate(BaseModel):
    name: str
    source_type: SourceType
    url: Optional[str] = None
    scrape_config: Optional[Dict[str, Any]] = None


class DataSourceResponse(BaseModel):
    id: str
    org_id: str
    industry_source_id: Optional[str] = None
    name: str
    source_type: str
    url: Optional[str] = None
    scrape_config: Dict[str, Any] = {}
    is_active: bool = True
    last_scraped_at: Optional[str] = None
    last_error: Optional[str] = None
    leads_count: int = 0
    created_at: str


class IndustrySourceResponse(BaseModel):
    id: str
    industry: str
    industry_ar: Optional[str] = None
    name: str
    name_ar: Optional[str] = None
    description: Optional[str] = None
    description_ar: Optional[str] = None
    source_type: str
    url: str
    region: Optional[str] = None
    is_active: bool = True


# ==================== INTEGRATION SCHEMAS ====================

class IntegrationCreate(BaseModel):
    type: str
    name: Optional[str] = None
    config: Dict[str, Any] = {}
    daily_limit: Optional[int] = None


class IntegrationResponse(BaseModel):
    id: str
    org_id: str
    type: str
    name: Optional[str] = None
    is_active: bool = True
    last_verified_at: Optional[str] = None
    last_error: Optional[str] = None
    daily_limit: Optional[int] = None
    used_today: int = 0
    created_at: str


# ==================== DASHBOARD SCHEMAS ====================

class DashboardStats(BaseModel):
    total_leads: int
    leads_this_month: int
    messages_sent: int
    replies_received: int
    reply_rate: float
    active_campaigns: int
    leads_by_status: Dict[str, int]
    leads_by_score: Dict[str, int]


class ActivityItem(BaseModel):
    id: str
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: str


# ==================== AI SCHEMAS ====================

class GenerateMessageRequest(BaseModel):
    lead_id: UUID
    channel: Channel
    custom_context: Optional[str] = None


class GenerateMessageResponse(BaseModel):
    subject: Optional[str] = None
    body: str
    tokens_used: int = 0


class ScoreLeadRequest(BaseModel):
    lead_id: UUID


class ScoreLeadResponse(BaseModel):
    score: int
    breakdown: Dict[str, Any]
    reasons: List[str] = []


class AnalyzeResponseRequest(BaseModel):
    message: str
    context: Optional[str] = None


class AnalyzeResponseResponse(BaseModel):
    sentiment: str
    intent: str
    inshallah_score: int = 5
    suggested_action: Optional[str] = None
    analysis: Optional[str] = None
