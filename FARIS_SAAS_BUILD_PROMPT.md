# FARIS AI - SaaS Platform Build Prompt

## CRITICAL RULES - READ FIRST

1. **NO MOCK DATA. NO PLACEHOLDERS. NO FAKE ANYTHING.**
2. Every feature must be REAL and FUNCTIONAL
3. Every button must DO THE REAL THING
4. Every API must ACTUALLY WORK
5. If something can't work without external service, show clear "Connect [Service]" UI

---

## Project Overview

Transform Faris AI from a single-user internal tool into a multi-tenant SaaS platform where Saudi businesses can:
- Sign up and create their own workspace
- Configure their company pitch/value proposition
- Choose industries and data sources to scrape
- Upload their own leads (CSV)
- Connect their own email/CRM
- Run AI-powered outreach campaigns
- Track results and responses

---

## Tech Stack

```
Backend:
- Python 3.11+ with FastAPI
- PostgreSQL (Supabase) for multi-tenant data
- Redis for job queues and caching
- Celery for background tasks (scraping, sending)

Frontend:
- React 18 with TypeScript
- Tailwind CSS (custom Saudi-inspired theme)
- React Query for data fetching
- React Router for navigation

Auth:
- Supabase Auth (email/password + Google OAuth)
- Row Level Security for tenant isolation

Infrastructure:
- Railway for backend
- Vercel/Netlify for frontend
- Supabase for DB + Auth
```

---

## Database Schema (PostgreSQL)

```sql
-- Organizations (tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, starter, pro, enterprise
    settings JSONB DEFAULT '{}'
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    org_id UUID REFERENCES organizations(id),
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMP DEFAULT NOW()
);

-- Company Profile (the customer's pitch)
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) UNIQUE,
    company_name VARCHAR(255),
    industry VARCHAR(100),
    value_proposition TEXT, -- What they sell
    target_audience TEXT, -- Who they sell to
    pain_points TEXT[], -- Problems they solve
    differentiators TEXT[], -- Why choose them
    tone VARCHAR(50) DEFAULT 'professional', -- professional, casual, formal
    language VARCHAR(10) DEFAULT 'ar', -- ar, en, mixed
    sdr_script TEXT, -- Custom sales script
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Data Sources (where to scrape)
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- website, rss, api, csv_upload
    url TEXT,
    industry VARCHAR(100),
    scrape_config JSONB, -- CSS selectors, API params, etc.
    is_active BOOLEAN DEFAULT TRUE,
    last_scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-built Industry Sources (available to all)
CREATE TABLE industry_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    url TEXT,
    scrape_config JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url TEXT,
    website TEXT,
    industry VARCHAR(100),
    funding_amount VARCHAR(100),
    funding_stage VARCHAR(50),
    employee_count VARCHAR(50),
    source_id UUID REFERENCES data_sources(id),
    source_url TEXT,
    raw_data JSONB,
    score INTEGER DEFAULT 0,
    score_breakdown JSONB,
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, replied, converted, archived
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
    channels TEXT[] DEFAULT '{}', -- email, linkedin, whatsapp
    target_industries TEXT[],
    min_score INTEGER DEFAULT 5,
    daily_limit INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Outreach Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    lead_id UUID REFERENCES leads(id),
    campaign_id UUID REFERENCES campaigns(id),
    channel VARCHAR(50) NOT NULL, -- email, linkedin, whatsapp
    subject TEXT,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent, delivered, opened, replied, bounced
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    replied_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Integrations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    type VARCHAR(50) NOT NULL, -- email_smtp, email_oauth, linkedin, hubspot, pipedrive, whatsapp
    name VARCHAR(255),
    config JSONB, -- Encrypted credentials, OAuth tokens
    is_active BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Usage Tracking (for billing)
CREATE TABLE usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    month DATE NOT NULL,
    leads_scraped INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    ai_tokens_used INTEGER DEFAULT 0,
    UNIQUE(org_id, month)
);
```

---

## API Endpoints

### Auth
```
POST /api/auth/register - Create account + organization
POST /api/auth/login - Login
POST /api/auth/logout - Logout
GET  /api/auth/me - Get current user
```

### Organization
```
GET  /api/org - Get org details
PUT  /api/org - Update org settings
GET  /api/org/members - List team members
POST /api/org/members/invite - Invite member
```

### Company Profile
```
GET  /api/profile - Get company profile
PUT  /api/profile - Update company profile
POST /api/profile/generate-pitch - AI generate pitch from website
```

### Data Sources
```
GET  /api/sources - List org's data sources
POST /api/sources - Add custom source
DELETE /api/sources/:id - Remove source
GET  /api/sources/industries - List available industry sources
POST /api/sources/industries/:id/enable - Enable industry source
POST /api/sources/:id/scrape - Trigger manual scrape
```

### Leads
```
GET  /api/leads - List leads (with filters)
GET  /api/leads/:id - Get lead details
POST /api/leads/import - Import from CSV
PUT  /api/leads/:id - Update lead
DELETE /api/leads/:id - Delete lead
POST /api/leads/:id/score - Recalculate score
POST /api/leads/:id/generate-message - Generate AI message
```

### Campaigns
```
GET  /api/campaigns - List campaigns
POST /api/campaigns - Create campaign
GET  /api/campaigns/:id - Get campaign details
PUT  /api/campaigns/:id - Update campaign
POST /api/campaigns/:id/start - Start campaign
POST /api/campaigns/:id/pause - Pause campaign
GET  /api/campaigns/:id/stats - Get campaign stats
```

### Messages
```
GET  /api/messages - List messages
POST /api/messages - Create/send message
GET  /api/messages/:id - Get message details
PUT  /api/messages/:id - Update message
POST /api/messages/:id/send - Send message
```

### Integrations
```
GET  /api/integrations - List integrations
POST /api/integrations/email/smtp - Connect SMTP email
POST /api/integrations/email/oauth - Connect Gmail/Outlook
POST /api/integrations/linkedin - Connect LinkedIn
POST /api/integrations/hubspot - Connect HubSpot
POST /api/integrations/whatsapp - Connect WhatsApp Business
DELETE /api/integrations/:id - Disconnect
POST /api/integrations/:id/verify - Verify connection
```

### AI
```
POST /api/ai/generate-message - Generate outreach message
POST /api/ai/score-lead - Score a lead
POST /api/ai/analyze-response - Analyze reply (Inshallah Decoder)
```

### Dashboard
```
GET /api/dashboard/stats - Overview stats
GET /api/dashboard/activity - Recent activity
GET /api/dashboard/performance - Campaign performance
```

---

## Frontend Pages

### Public
```
/ - Landing page (farisai.app style)
/login - Login
/register - Sign up
/pricing - Pricing plans
```

### App (authenticated)
```
/app - Dashboard overview
/app/leads - Lead management
/app/leads/:id - Lead detail
/app/leads/import - CSV import
/app/campaigns - Campaign list
/app/campaigns/new - Create campaign
/app/campaigns/:id - Campaign detail
/app/sources - Data sources
/app/messages - Message history
/app/settings - Organization settings
/app/settings/profile - Company profile
/app/settings/team - Team members
/app/settings/integrations - Connect services
/app/settings/billing - Subscription & usage
```

---

## UI Components Needed

### Layout
- AppShell (sidebar + header + main)
- Sidebar navigation (Arabic RTL)
- Header with org switcher + user menu
- Mobile responsive drawer

### Common
- Button (primary, secondary, ghost, danger)
- Input (text, email, password, textarea)
- Select / Dropdown
- Modal / Dialog
- Toast notifications
- Loading spinner / Skeleton
- Empty state
- Error state
- Pagination
- Data table with sorting/filtering

### Domain-Specific
- LeadCard - Show lead with score badge
- MessagePreview - Show generated message
- CampaignCard - Campaign status + stats
- IntegrationCard - Service connection status
- ScoreBadge - Color-coded score (green/yellow/red)
- ChannelBadge - Email/LinkedIn/WhatsApp icons
- StatusBadge - Message/campaign status

---

## Design System

### Colors (Saudi-inspired, NOT purple)
```css
:root {
  /* Primary - Saudi Green */
  --primary-50: #E8F5E9;
  --primary-100: #C8E6C9;
  --primary-500: #006C35;
  --primary-600: #005A2B;
  --primary-700: #004D25;
  
  /* Secondary - Gold/Sand */
  --secondary-50: #FFF8E1;
  --secondary-100: #FFECB3;
  --secondary-500: #C4A052;
  --secondary-600: #B8943E;
  
  /* Neutral - Warm grays */
  --neutral-50: #FAFAF8;
  --neutral-100: #F5F3EE;
  --neutral-200: #E8E6E1;
  --neutral-300: #D4D2CD;
  --neutral-700: #4A4A45;
  --neutral-900: #1A1A18;
  
  /* Status */
  --success: #22C55E;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
}
```

### Typography
```css
/* Arabic-first */
font-family: 'IBM Plex Sans Arabic', 'Inter', sans-serif;

/* Scale */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
```

### Direction
```css
html {
  direction: rtl;
}
```

---

## Pre-Built Industry Sources

```json
[
  {
    "industry": "startups",
    "name": "Jawlah.co",
    "url": "https://jawlah.co",
    "description": "Saudi startup news and funding"
  },
  {
    "industry": "startups",
    "name": "Wamda",
    "url": "https://wamda.com",
    "description": "MENA startup ecosystem"
  },
  {
    "industry": "ecommerce",
    "name": "Ecommerce Saudi",
    "url": "https://ecommerce.sa",
    "description": "Saudi ecommerce directory"
  },
  {
    "industry": "fintech",
    "name": "Fintech Saudi",
    "url": "https://fintechsaudi.com",
    "description": "Saudi fintech ecosystem"
  },
  {
    "industry": "restaurants",
    "name": "Foursquare API",
    "url": "https://api.foursquare.com",
    "description": "Restaurant and F&B data"
  },
  {
    "industry": "real_estate",
    "name": "Bayut Saudi",
    "url": "https://bayut.sa",
    "description": "Real estate listings"
  }
]
```

---

## WhatsApp Solution

Since we can't get phone numbers from scraping:

### Option 1: CSV Upload
- Let users upload their own contact list with phone numbers
- Validate phone format (Saudi: +966...)
- Store securely

### Option 2: Lead Enrichment API
- Integrate with Apollo.io, Clearbit, or similar
- Auto-enrich leads with phone numbers
- Costs money per lookup

### Option 3: Manual Entry
- Users manually add phone numbers to leads
- WhatsApp template ready when number exists

### Implementation
- Show "WhatsApp" channel as available
- If lead has no phone: show "Add phone number" prompt
- If lead has phone: show "Send WhatsApp" button
- Connect via WhatsApp Business API (Twilio or 360dialog)

---

## File Structure

```
faris-saas/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Settings
│   │   ├── database.py          # DB connection
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── organization.py
│   │   │   ├── lead.py
│   │   │   ├── campaign.py
│   │   │   └── message.py
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── api/                 # Route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── leads.py
│   │   │   ├── campaigns.py
│   │   │   ├── sources.py
│   │   │   └── integrations.py
│   │   ├── services/            # Business logic
│   │   │   ├── scraper.py
│   │   │   ├── ai_generator.py
│   │   │   ├── lead_scorer.py
│   │   │   └── outreach.py
│   │   └── workers/             # Background jobs
│   │       ├── scrape_job.py
│   │       └── send_job.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.toml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── App.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── database/
│   └── schema.sql
│
└── docs/
    └── API.md
```

---

## Build Order

### Phase 1: Foundation (DO THIS FIRST)
1. Set up PostgreSQL schema
2. FastAPI backend with auth
3. Basic React frontend with login/register
4. Dashboard shell with navigation

### Phase 2: Core Features
5. Company profile setup wizard
6. Lead management (list, detail, import CSV)
7. AI message generation
8. Lead scoring

### Phase 3: Data Sources
9. Industry source selector
10. Custom source configuration
11. Scraper worker jobs
12. Source status monitoring

### Phase 4: Campaigns
13. Campaign creation wizard
14. Email integration (SMTP + OAuth)
15. Message sending queue
16. Campaign analytics

### Phase 5: Advanced
17. LinkedIn integration
18. WhatsApp integration
19. CRM integrations
20. Team management
21. Billing/subscriptions

---

## Environment Variables Needed

```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...

# Auth
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI
ANTHROPIC_API_KEY=...

# Email
RESEND_API_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

# Integrations
HUBSPOT_CLIENT_ID=...
HUBSPOT_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# Redis
REDIS_URL=...
```

---

## START BUILDING NOW

Begin with Phase 1:
1. Create the database schema in Supabase
2. Build FastAPI backend with auth endpoints
3. Build React frontend with auth pages
4. Create the dashboard shell

NO MOCK DATA. EVERYTHING REAL.

Go!
