# فارس AI - Faris AI SaaS Platform

منصة ذكاء اصطناعي للمبيعات مصممة للسوق السعودي

## 🚀 Features

- **Multi-tenant SaaS**: Each customer gets their own workspace
- **AI Message Generation**: Personalized outreach in Arabic/English
- **Lead Management**: Import, score, and track leads
- **Campaign Automation**: Email, LinkedIn, WhatsApp outreach
- **Industry Data Sources**: Pre-built scrapers for Saudi markets
- **Inshallah Decoder**: Analyze Saudi business responses

## 📁 Project Structure

```
faris-saas/
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── workers/       # Background jobs
│   ├── requirements.txt
│   └── .env.example
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # API client, auth
│   │   └── styles/        # CSS
│   └── package.json
└── database/
    └── schema.sql         # PostgreSQL schema
```

## 🛠 Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- PostgreSQL (Supabase)
- Anthropic Claude API

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- React Query

## 🏃‍♂️ Quick Start

### 1. Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the schema:
   ```sql
   -- Copy contents of database/schema.sql to Supabase SQL Editor
   ```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Copy env file and fill in values
cp .env.example .env

# Run server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Run dev server
npm run dev
```

### 4. Access the App

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/api/docs

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/profile` | GET/PUT | Company profile |
| `/api/leads` | GET/POST | List/create leads |
| `/api/leads/import` | POST | Import CSV |
| `/api/campaigns` | GET/POST | Campaigns |
| `/api/sources` | GET/POST | Data sources |
| `/api/ai/generate-message` | POST | Generate outreach |
| `/api/ai/score-lead` | POST | Score a lead |
| `/api/dashboard/stats` | GET | Dashboard stats |

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `ANTHROPIC_API_KEY` | Claude API key |
| `RESEND_API_KEY` | Email service key |
| `JWT_SECRET` | Auth token secret |

## 🚀 Deployment

### Railway (Backend)

1. Connect GitHub repo
2. Set environment variables
3. Deploy

### Vercel (Frontend)

1. Connect GitHub repo
2. Set `VITE_API_URL` to backend URL
3. Deploy

## 📝 License

Proprietary - PMAX

## 🤝 Support

Contact: support@farisai.app
