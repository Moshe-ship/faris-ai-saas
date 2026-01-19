"""
SQLAlchemy Models for Faris AI SaaS
"""

from sqlalchemy import (
    Column, String, Text, Boolean, Integer, DateTime, Date,
    ForeignKey, ARRAY, JSON, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    logo_url = Column(Text)
    subscription_tier = Column(String(50), default="free")
    subscription_ends_at = Column(DateTime)
    settings = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    company_profile = relationship("CompanyProfile", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    data_sources = relationship("DataSource", back_populates="organization", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="organization", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="organization", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="organization", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="organization", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="organization", cascade="all, delete-orphan")
    usage = relationship("Usage", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255))
    name = Column(String(255))
    avatar_url = Column(Text)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    role = Column(String(50), default="member")
    email_verified = Column(Boolean, default=False)
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    activity_logs = relationship("ActivityLog", back_populates="user")


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), unique=True)
    company_name = Column(String(255))
    company_name_ar = Column(String(255))
    industry = Column(String(100))
    website = Column(Text)
    value_proposition = Column(Text)
    value_proposition_ar = Column(Text)
    target_audience = Column(Text)
    pain_points = Column(ARRAY(Text))
    differentiators = Column(ARRAY(Text))
    tone = Column(String(50), default="professional")
    language = Column(String(10), default="mixed")
    sdr_script = Column(Text)
    sdr_script_ar = Column(Text)
    example_messages = Column(JSONB, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="company_profile")


class IndustrySource(Base):
    __tablename__ = "industry_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    industry = Column(String(100), nullable=False)
    industry_ar = Column(String(100))
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255))
    description = Column(Text)
    description_ar = Column(Text)
    source_type = Column(String(50), nullable=False)
    url = Column(Text, nullable=False)
    scrape_config = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)
    region = Column(String(50), default="saudi")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    data_sources = relationship("DataSource", back_populates="industry_source")


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    industry_source_id = Column(UUID(as_uuid=True), ForeignKey("industry_sources.id"))
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    url = Column(Text)
    scrape_config = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    last_scraped_at = Column(DateTime)
    last_error = Column(Text)
    leads_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="data_sources")
    industry_source = relationship("IndustrySource", back_populates="data_sources")
    leads = relationship("Lead", back_populates="source")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))

    # Company info
    company_name = Column(String(255), nullable=False)
    company_name_ar = Column(String(255))
    website = Column(Text)
    industry = Column(String(100))

    # Contact info
    contact_name = Column(String(255))
    contact_title = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    linkedin_url = Column(Text)

    # Business info
    funding_amount = Column(String(100))
    funding_stage = Column(String(50))
    funding_date = Column(Date)
    employee_count = Column(String(50))
    revenue_range = Column(String(50))
    location = Column(String(255))

    # Source tracking
    source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"))
    source_url = Column(Text)
    raw_data = Column(JSONB)

    # Scoring
    score = Column(Integer, default=0)
    score_breakdown = Column(JSONB, default={})

    # Status
    status = Column(String(50), default="new")
    status_updated_at = Column(DateTime)

    # Metadata
    notes = Column(Text)
    tags = Column(ARRAY(Text))
    custom_fields = Column(JSONB, default={})

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="leads")
    source = relationship("DataSource", back_populates="leads")
    messages = relationship("Message", back_populates="lead", cascade="all, delete-orphan")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))

    name = Column(String(255), nullable=False)
    description = Column(Text)

    # Targeting
    target_industries = Column(ARRAY(Text))
    target_statuses = Column(ARRAY(Text), default=["new"])
    min_score = Column(Integer, default=5)
    max_leads = Column(Integer)

    # Channels
    channels = Column(ARRAY(Text), default=["email"])

    # Scheduling
    daily_limit = Column(Integer, default=20)
    send_times = Column(JSONB, default={"start": "09:00", "end": "17:00", "days": [0,1,2,3,4]})
    respect_prayer_times = Column(Boolean, default=True)

    # Templates
    email_subject_template = Column(Text)
    message_template = Column(Text)

    # Status
    status = Column(String(50), default="draft")

    # Stats
    leads_contacted = Column(Integer, default=0)
    replies_received = Column(Integer, default=0)
    meetings_booked = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    paused_at = Column(DateTime)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="campaigns")
    messages = relationship("Message", back_populates="campaign")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"))

    # Message content
    channel = Column(String(50), nullable=False)
    subject = Column(Text)
    body = Column(Text, nullable=False)

    # Personalization tracking
    ai_generated = Column(Boolean, default=False)
    template_used = Column(Text)
    personalization_data = Column(JSONB)

    # Status tracking
    status = Column(String(50), default="draft")

    # Timestamps
    scheduled_for = Column(DateTime)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    opened_at = Column(DateTime)
    clicked_at = Column(DateTime)
    replied_at = Column(DateTime)

    # Error tracking
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)

    # External IDs
    external_id = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="messages")
    lead = relationship("Lead", back_populates="messages")
    campaign = relationship("Campaign", back_populates="messages")


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))

    type = Column(String(50), nullable=False)
    name = Column(String(255))

    # Configuration (should be encrypted at rest)
    config = Column(JSONB, nullable=False, default={})

    # Status
    is_active = Column(Boolean, default=True)
    last_verified_at = Column(DateTime)
    last_error = Column(Text)

    # Usage limits
    daily_limit = Column(Integer)
    used_today = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="integrations")


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(UUID(as_uuid=True))

    details = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="activity_logs")
    user = relationship("User", back_populates="activity_logs")


class Usage(Base):
    __tablename__ = "usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    month = Column(Date, nullable=False)

    leads_scraped = Column(Integer, default=0)
    leads_imported = Column(Integer, default=0)
    messages_sent = Column(Integer, default=0)
    ai_generations = Column(Integer, default=0)
    ai_tokens_used = Column(Integer, default=0)

    # Relationships
    organization = relationship("Organization", back_populates="usage")

    __table_args__ = (
        # Unique constraint on org_id + month
    )


class SubscriptionLimit(Base):
    __tablename__ = "subscription_limits"

    tier = Column(String(50), primary_key=True)
    monthly_leads = Column(Integer)
    monthly_messages = Column(Integer)
    monthly_ai_generations = Column(Integer)
    team_members = Column(Integer)
    data_sources = Column(Integer)
    campaigns = Column(Integer)
    integrations = Column(ARRAY(Text))
    features = Column(ARRAY(Text))
