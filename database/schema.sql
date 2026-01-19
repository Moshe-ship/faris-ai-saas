-- FARIS AI SaaS Database Schema
-- Multi-tenant architecture with Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ORGANIZATIONS (Tenants)
-- =============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, starter, pro, enterprise
    subscription_ends_at TIMESTAMP,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- USERS
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL if using OAuth
    name VARCHAR(255),
    avatar_url TEXT,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org_id ON users(org_id);

-- =============================================
-- COMPANY PROFILES (The customer's pitch)
-- =============================================
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255),
    company_name_ar VARCHAR(255), -- Arabic name
    industry VARCHAR(100),
    website TEXT,
    value_proposition TEXT, -- What they sell
    value_proposition_ar TEXT, -- Arabic version
    target_audience TEXT, -- Who they sell to
    pain_points TEXT[], -- Problems they solve
    differentiators TEXT[], -- Why choose them
    tone VARCHAR(50) DEFAULT 'professional', -- professional, casual, formal, friendly
    language VARCHAR(10) DEFAULT 'mixed', -- ar, en, mixed
    sdr_script TEXT, -- Custom sales script
    sdr_script_ar TEXT, -- Arabic sales script
    example_messages JSONB DEFAULT '[]', -- Example outreach messages for AI to learn from
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDUSTRY SOURCES (Pre-built, available to all)
-- =============================================
CREATE TABLE industry_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    industry VARCHAR(100) NOT NULL,
    industry_ar VARCHAR(100), -- Arabic industry name
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    source_type VARCHAR(50) NOT NULL, -- website, rss, api
    url TEXT NOT NULL,
    scrape_config JSONB NOT NULL, -- CSS selectors, API params, etc.
    is_active BOOLEAN DEFAULT TRUE,
    region VARCHAR(50) DEFAULT 'saudi', -- saudi, uae, mena, global
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert pre-built sources
INSERT INTO industry_sources (industry, industry_ar, name, name_ar, description, description_ar, source_type, url, scrape_config, region) VALUES
('startups', 'الشركات الناشئة', 'Jawlah.co', 'جولة', 'Saudi startup news and funding announcements', 'أخبار الشركات الناشئة السعودية وجولات التمويل', 'website', 'https://jawlah.co', '{"selector": "article", "title": "h2", "link": "a", "date": "time"}', 'saudi'),
('startups', 'الشركات الناشئة', 'Wamda', 'ومضة', 'MENA startup ecosystem news', 'أخبار منظومة الشركات الناشئة في المنطقة', 'website', 'https://wamda.com/ar', '{"selector": ".post-item", "title": "h3", "link": "a"}', 'mena'),
('fintech', 'التقنية المالية', 'Fintech Saudi', 'فنتك السعودية', 'Saudi fintech ecosystem directory', 'دليل منظومة التقنية المالية السعودية', 'website', 'https://fintechsaudi.com', '{"selector": ".company-card", "title": "h3"}', 'saudi'),
('ecommerce', 'التجارة الإلكترونية', 'Maroof', 'معروف', 'Saudi ecommerce business registry', 'سجل الأعمال التجارية الإلكترونية السعودية', 'api', 'https://maroof.sa', '{"endpoint": "/api/businesses"}', 'saudi'),
('technology', 'التقنية', 'MCIT Companies', 'شركات وزارة الاتصالات', 'Tech companies registered with MCIT', 'الشركات التقنية المسجلة لدى وزارة الاتصالات', 'website', 'https://mcit.gov.sa', '{}', 'saudi');

-- =============================================
-- DATA SOURCES (Custom sources per org)
-- =============================================
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    industry_source_id UUID REFERENCES industry_sources(id), -- NULL if custom
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- website, rss, api, csv_upload
    url TEXT,
    scrape_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_scraped_at TIMESTAMP,
    last_error TEXT,
    leads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_sources_org ON data_sources(org_id);

-- =============================================
-- LEADS
-- =============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Company info
    company_name VARCHAR(255) NOT NULL,
    company_name_ar VARCHAR(255),
    website TEXT,
    industry VARCHAR(100),
    
    -- Contact info
    contact_name VARCHAR(255),
    contact_title VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url TEXT,
    
    -- Business info
    funding_amount VARCHAR(100),
    funding_stage VARCHAR(50), -- seed, series_a, series_b, etc.
    funding_date DATE,
    employee_count VARCHAR(50),
    revenue_range VARCHAR(50),
    location VARCHAR(255),
    
    -- Source tracking
    source_id UUID REFERENCES data_sources(id),
    source_url TEXT,
    raw_data JSONB,
    
    -- Scoring
    score INTEGER DEFAULT 0,
    score_breakdown JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, replied, meeting_scheduled, converted, not_interested, archived
    status_updated_at TIMESTAMP,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_org ON leads(org_id);
CREATE INDEX idx_leads_status ON leads(org_id, status);
CREATE INDEX idx_leads_score ON leads(org_id, score DESC);
CREATE INDEX idx_leads_industry ON leads(org_id, industry);

-- =============================================
-- CAMPAIGNS
-- =============================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Targeting
    target_industries TEXT[],
    target_statuses TEXT[] DEFAULT ARRAY['new'],
    min_score INTEGER DEFAULT 5,
    max_leads INTEGER, -- NULL = unlimited
    
    -- Channels
    channels TEXT[] DEFAULT ARRAY['email'], -- email, linkedin, whatsapp
    
    -- Scheduling
    daily_limit INTEGER DEFAULT 20,
    send_times JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": [0,1,2,3,4]}', -- Sun-Thu
    respect_prayer_times BOOLEAN DEFAULT TRUE,
    
    -- Templates
    email_subject_template TEXT,
    message_template TEXT, -- If NULL, use AI generation
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
    
    -- Stats
    leads_contacted INTEGER DEFAULT 0,
    replies_received INTEGER DEFAULT 0,
    meetings_booked INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    paused_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_org ON campaigns(org_id);
CREATE INDEX idx_campaigns_status ON campaigns(org_id, status);

-- =============================================
-- MESSAGES
-- =============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    -- Message content
    channel VARCHAR(50) NOT NULL, -- email, linkedin, whatsapp
    subject TEXT, -- For email
    body TEXT NOT NULL,
    
    -- Personalization tracking
    ai_generated BOOLEAN DEFAULT FALSE,
    template_used TEXT,
    personalization_data JSONB,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, sent, delivered, opened, clicked, replied, bounced, failed
    
    -- Timestamps
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- External IDs
    external_id VARCHAR(255), -- Message ID from email provider, etc.
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_org ON messages(org_id);
CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_status ON messages(org_id, status);

-- =============================================
-- INTEGRATIONS
-- =============================================
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- email_smtp, email_resend, email_gmail, linkedin, hubspot, pipedrive, whatsapp_twilio, whatsapp_360dialog
    name VARCHAR(255), -- User-friendly name
    
    -- Configuration (encrypted at rest)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMP,
    last_error TEXT,
    
    -- Usage limits
    daily_limit INTEGER,
    used_today INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_org ON integrations(org_id);
CREATE UNIQUE INDEX idx_integrations_unique ON integrations(org_id, type);

-- =============================================
-- ACTIVITY LOG
-- =============================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- lead.created, message.sent, campaign.started, etc.
    entity_type VARCHAR(50), -- lead, message, campaign, etc.
    entity_id UUID,
    
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_org ON activity_log(org_id);
CREATE INDEX idx_activity_created ON activity_log(org_id, created_at DESC);

-- =============================================
-- USAGE TRACKING (for billing)
-- =============================================
CREATE TABLE usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- First day of month
    
    leads_scraped INTEGER DEFAULT 0,
    leads_imported INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    ai_generations INTEGER DEFAULT 0,
    ai_tokens_used INTEGER DEFAULT 0,
    
    UNIQUE(org_id, month)
);

CREATE INDEX idx_usage_org ON usage(org_id);

-- =============================================
-- SUBSCRIPTION LIMITS
-- =============================================
CREATE TABLE subscription_limits (
    tier VARCHAR(50) PRIMARY KEY,
    monthly_leads INTEGER,
    monthly_messages INTEGER,
    monthly_ai_generations INTEGER,
    team_members INTEGER,
    data_sources INTEGER,
    campaigns INTEGER,
    integrations TEXT[],
    features TEXT[]
);

INSERT INTO subscription_limits VALUES
('free', 100, 50, 25, 1, 2, 1, ARRAY['email'], ARRAY['basic_scoring']),
('starter', 500, 250, 100, 3, 5, 5, ARRAY['email', 'linkedin'], ARRAY['basic_scoring', 'csv_import']),
('pro', 2000, 1000, 500, 10, 20, 20, ARRAY['email', 'linkedin', 'whatsapp'], ARRAY['basic_scoring', 'csv_import', 'advanced_scoring', 'api_access']),
('enterprise', -1, -1, -1, -1, -1, -1, ARRAY['email', 'linkedin', 'whatsapp', 'hubspot', 'pipedrive'], ARRAY['basic_scoring', 'csv_import', 'advanced_scoring', 'api_access', 'custom_integrations', 'dedicated_support']);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created based on your auth setup
-- Example for Supabase:
-- CREATE POLICY "Users can view their own organization" ON organizations
--   FOR SELECT USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================
-- FUNCTIONS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON company_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_org_id UUID,
    p_field TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage (org_id, month, leads_scraped, leads_imported, messages_sent, ai_generations, ai_tokens_used)
    VALUES (p_org_id, DATE_TRUNC('month', CURRENT_DATE), 0, 0, 0, 0, 0)
    ON CONFLICT (org_id, month) DO NOTHING;
    
    EXECUTE format('UPDATE usage SET %I = %I + $1 WHERE org_id = $2 AND month = DATE_TRUNC(''month'', CURRENT_DATE)', p_field, p_field)
    USING p_amount, p_org_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_org_id UUID,
    p_field TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tier VARCHAR(50);
    v_limit INTEGER;
    v_used INTEGER;
BEGIN
    -- Get org's subscription tier
    SELECT subscription_tier INTO v_tier FROM organizations WHERE id = p_org_id;
    
    -- Get limit for this tier
    EXECUTE format('SELECT %I FROM subscription_limits WHERE tier = $1', 'monthly_' || p_field)
    INTO v_limit USING v_tier;
    
    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Get current usage
    EXECUTE format('SELECT COALESCE(%I, 0) FROM usage WHERE org_id = $1 AND month = DATE_TRUNC(''month'', CURRENT_DATE)', p_field)
    INTO v_used USING p_org_id;
    
    RETURN COALESCE(v_used, 0) < v_limit;
END;
$$ LANGUAGE plpgsql;
