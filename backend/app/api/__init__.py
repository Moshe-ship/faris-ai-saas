"""
Faris AI SaaS - All API Routes (SQLAlchemy version)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import jwt
import csv
import io

from app.config import settings
from app.database import get_db
from app.models import (
    Organization, User, CompanyProfile, IndustrySource, DataSource,
    Lead, Campaign, Message, Integration, ActivityLog, Usage
)
from app.schemas import *
import bcrypt

security = HTTPBearer()

# ==================== AUTH HELPERS ====================

def create_slug(name: str) -> str:
    import re
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    return f"{slug.strip('-')}-{str(uuid4())[:8]}"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, org_id: str) -> str:
    payload = {
        "sub": user_id,
        "org": org_id,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_token(credentials.credentials)
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ==================== AUTH ROUTES ====================
auth_router = APIRouter()

@auth_router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")

    # Create organization
    org = Organization(
        name=data.company_name,
        slug=create_slug(data.company_name),
        subscription_tier="free"
    )
    db.add(org)
    db.flush()

    # Create user
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        org_id=org.id,
        role="owner"
    )
    db.add(user)
    db.flush()

    # Create company profile
    profile = CompanyProfile(
        org_id=org.id,
        company_name=data.company_name
    )
    db.add(profile)
    db.commit()

    return TokenResponse(
        access_token=create_token(str(user.id), str(org.id)),
        expires_in=settings.JWT_EXPIRY_HOURS * 3600,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            role=UserRole(user.role),
            org_id=str(org.id),
            created_at=user.created_at.isoformat()
        )
    )

@auth_router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")

    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()

    return TokenResponse(
        access_token=create_token(str(user.id), str(user.org_id)),
        expires_in=settings.JWT_EXPIRY_HOURS * 3600,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            role=UserRole(user.role),
            org_id=str(user.org_id),
            created_at=user.created_at.isoformat()
        )
    )

@auth_router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        role=UserRole(user.role),
        org_id=str(user.org_id),
        created_at=user.created_at.isoformat()
    )

# ==================== PROFILE ROUTES ====================
profile_router = APIRouter()

@profile_router.get("", response_model=CompanyProfileResponse)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CompanyProfile).filter(CompanyProfile.org_id == user.org_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _profile_to_response(profile)

@profile_router.put("", response_model=CompanyProfileResponse)
def update_profile(data: CompanyProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CompanyProfile).filter(CompanyProfile.org_id == user.org_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = data.model_dump(exclude_unset=True)
    if "tone" in update_data and update_data["tone"]:
        update_data["tone"] = update_data["tone"].value
    if "language" in update_data and update_data["language"]:
        update_data["language"] = update_data["language"].value

    for key, value in update_data.items():
        if value is not None:
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return _profile_to_response(profile)

def _profile_to_response(profile: CompanyProfile) -> CompanyProfileResponse:
    return CompanyProfileResponse(
        id=str(profile.id),
        org_id=str(profile.org_id),
        company_name=profile.company_name,
        company_name_ar=profile.company_name_ar,
        industry=profile.industry,
        website=profile.website,
        value_proposition=profile.value_proposition,
        value_proposition_ar=profile.value_proposition_ar,
        target_audience=profile.target_audience,
        pain_points=profile.pain_points or [],
        differentiators=profile.differentiators or [],
        tone=profile.tone,
        language=profile.language,
        sdr_script=profile.sdr_script,
        sdr_script_ar=profile.sdr_script_ar,
        created_at=profile.created_at.isoformat(),
        updated_at=profile.updated_at.isoformat() if profile.updated_at else None
    )

# ==================== LEADS ROUTES ====================
leads_router = APIRouter()

@leads_router.get("", response_model=LeadListResponse)
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[LeadStatus] = None,
    industry: Optional[str] = None,
    min_score: Optional[int] = Query(None, ge=0, le=10),
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Lead).filter(Lead.org_id == user.org_id)

    if status:
        query = query.filter(Lead.status == status.value)
    if industry:
        query = query.filter(Lead.industry == industry)
    if min_score is not None:
        query = query.filter(Lead.score >= min_score)
    if search:
        query = query.filter(
            or_(
                Lead.company_name.ilike(f"%{search}%"),
                Lead.contact_name.ilike(f"%{search}%")
            )
        )

    total = query.count()
    offset = (page - 1) * page_size
    leads = query.order_by(Lead.created_at.desc()).offset(offset).limit(page_size).all()

    return LeadListResponse(
        leads=[_lead_to_response(l) for l in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@leads_router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="العميل المحتمل غير موجود")
    return _lead_to_response(lead)

@leads_router.post("", response_model=LeadResponse, status_code=201)
def create_lead(data: LeadCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = Lead(
        org_id=user.org_id,
        status="new",
        score=0,
        score_breakdown={},
        **data.model_dump()
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return _lead_to_response(lead)

@leads_router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: UUID, data: LeadUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="العميل المحتمل غير موجود")

    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].value

    for key, value in update_data.items():
        if value is not None:
            setattr(lead, key, value)

    db.commit()
    db.refresh(lead)
    return _lead_to_response(lead)

@leads_router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == user.org_id).first()
    if lead:
        db.delete(lead)
        db.commit()

@leads_router.post("/import")
def import_leads(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="يجب أن يكون الملف CSV")

    content = file.file.read()
    reader = csv.DictReader(io.StringIO(content.decode('utf-8-sig')))

    imported, skipped = 0, 0
    for row in reader:
        if not row.get('company_name'):
            continue

        existing = db.query(Lead).filter(
            Lead.org_id == user.org_id,
            Lead.company_name == row['company_name']
        ).first()

        if existing:
            skipped += 1
            continue

        lead = Lead(
            org_id=user.org_id,
            company_name=row['company_name'],
            email=row.get('email'),
            phone=row.get('phone'),
            industry=row.get('industry'),
            website=row.get('website'),
            contact_name=row.get('contact_name'),
            status="new",
            score=0
        )
        db.add(lead)
        imported += 1

    db.commit()
    return {"imported": imported, "skipped": skipped}

def _lead_to_response(lead: Lead) -> LeadResponse:
    return LeadResponse(
        id=str(lead.id),
        org_id=str(lead.org_id),
        company_name=lead.company_name,
        company_name_ar=lead.company_name_ar,
        website=lead.website,
        industry=lead.industry,
        contact_name=lead.contact_name,
        contact_title=lead.contact_title,
        email=lead.email,
        phone=lead.phone,
        linkedin_url=lead.linkedin_url,
        funding_amount=lead.funding_amount,
        funding_stage=lead.funding_stage,
        employee_count=lead.employee_count,
        location=lead.location,
        source_id=str(lead.source_id) if lead.source_id else None,
        source_url=lead.source_url,
        raw_data=lead.raw_data,
        score=lead.score or 0,
        score_breakdown=lead.score_breakdown or {},
        status=lead.status,
        notes=lead.notes,
        tags=lead.tags or [],
        created_at=lead.created_at.isoformat(),
        updated_at=lead.updated_at.isoformat() if lead.updated_at else None
    )

# ==================== CAMPAIGNS ROUTES ====================
campaigns_router = APIRouter()

@campaigns_router.get("", response_model=List[CampaignResponse])
def list_campaigns(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).filter(Campaign.org_id == user.org_id).order_by(Campaign.created_at.desc()).all()
    return [_campaign_to_response(c) for c in campaigns]

@campaigns_router.post("", response_model=CampaignResponse, status_code=201)
def create_campaign(data: CampaignCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaign_data = data.model_dump()

    # Convert enums to values
    if "channels" in campaign_data and campaign_data["channels"]:
        campaign_data["channels"] = [c.value if hasattr(c, 'value') else c for c in campaign_data["channels"]]

    campaign = Campaign(
        org_id=user.org_id,
        status="draft",
        leads_contacted=0,
        replies_received=0,
        meetings_booked=0,
        **campaign_data
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return _campaign_to_response(campaign)

@campaigns_router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.org_id == user.org_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="الحملة غير موجودة")
    return _campaign_to_response(campaign)

@campaigns_router.post("/{campaign_id}/start")
def start_campaign(campaign_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.org_id == user.org_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="الحملة غير موجودة")

    campaign.status = "active"
    campaign.started_at = datetime.utcnow()
    db.commit()
    return {"message": "تم بدء الحملة"}

@campaigns_router.post("/{campaign_id}/pause")
def pause_campaign(campaign_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.org_id == user.org_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="الحملة غير موجودة")

    campaign.status = "paused"
    campaign.paused_at = datetime.utcnow()
    db.commit()
    return {"message": "تم إيقاف الحملة"}

def _campaign_to_response(campaign: Campaign) -> CampaignResponse:
    return CampaignResponse(
        id=str(campaign.id),
        org_id=str(campaign.org_id),
        name=campaign.name,
        description=campaign.description,
        target_industries=campaign.target_industries or [],
        target_statuses=campaign.target_statuses or ["new"],
        min_score=campaign.min_score or 5,
        max_leads=campaign.max_leads,
        channels=campaign.channels or ["email"],
        daily_limit=campaign.daily_limit or 20,
        send_times=campaign.send_times,
        email_subject_template=campaign.email_subject_template,
        message_template=campaign.message_template,
        status=campaign.status,
        leads_contacted=campaign.leads_contacted or 0,
        replies_received=campaign.replies_received or 0,
        meetings_booked=campaign.meetings_booked or 0,
        created_at=campaign.created_at.isoformat(),
        started_at=campaign.started_at.isoformat() if campaign.started_at else None,
        paused_at=campaign.paused_at.isoformat() if campaign.paused_at else None,
        completed_at=campaign.completed_at.isoformat() if campaign.completed_at else None
    )

# ==================== SOURCES ROUTES ====================
sources_router = APIRouter()

@sources_router.get("/industries", response_model=List[IndustrySourceResponse])
def list_industry_sources(db: Session = Depends(get_db)):
    sources = db.query(IndustrySource).filter(IndustrySource.is_active == True).all()
    return [_industry_source_to_response(s) for s in sources]

@sources_router.get("", response_model=List[DataSourceResponse])
def list_data_sources(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sources = db.query(DataSource).filter(DataSource.org_id == user.org_id).all()
    return [_data_source_to_response(s) for s in sources]

@sources_router.post("", response_model=DataSourceResponse, status_code=201)
def create_data_source(data: DataSourceCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = DataSource(
        org_id=user.org_id,
        leads_count=0,
        **data.model_dump()
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return _data_source_to_response(source)

@sources_router.post("/industries/{source_id}/enable", response_model=DataSourceResponse)
def enable_industry_source(source_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    industry_source = db.query(IndustrySource).filter(IndustrySource.id == source_id).first()
    if not industry_source:
        raise HTTPException(status_code=404, detail="المصدر غير موجود")

    source = DataSource(
        org_id=user.org_id,
        industry_source_id=source_id,
        name=industry_source.name,
        source_type=industry_source.source_type,
        url=industry_source.url,
        scrape_config=industry_source.scrape_config,
        leads_count=0
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return _data_source_to_response(source)

def _industry_source_to_response(source: IndustrySource) -> IndustrySourceResponse:
    return IndustrySourceResponse(
        id=str(source.id),
        industry=source.industry,
        industry_ar=source.industry_ar,
        name=source.name,
        name_ar=source.name_ar,
        description=source.description,
        description_ar=source.description_ar,
        source_type=source.source_type,
        url=source.url,
        region=source.region,
        is_active=source.is_active
    )

def _data_source_to_response(source: DataSource) -> DataSourceResponse:
    return DataSourceResponse(
        id=str(source.id),
        org_id=str(source.org_id),
        industry_source_id=str(source.industry_source_id) if source.industry_source_id else None,
        name=source.name,
        source_type=source.source_type,
        url=source.url,
        scrape_config=source.scrape_config or {},
        is_active=source.is_active,
        last_scraped_at=source.last_scraped_at.isoformat() if source.last_scraped_at else None,
        last_error=source.last_error,
        leads_count=source.leads_count or 0,
        created_at=source.created_at.isoformat()
    )

# ==================== INTEGRATIONS ROUTES ====================
integrations_router = APIRouter()

@integrations_router.get("", response_model=List[IntegrationResponse])
def list_integrations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    integrations = db.query(Integration).filter(Integration.org_id == user.org_id).all()
    return [_integration_to_response(i) for i in integrations]

@integrations_router.post("", response_model=IntegrationResponse, status_code=201)
def create_integration(data: IntegrationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if integration type already exists
    existing = db.query(Integration).filter(
        Integration.org_id == user.org_id,
        Integration.type == data.type
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="هذا النوع من التكامل موجود بالفعل")

    integration = Integration(
        org_id=user.org_id,
        used_today=0,
        **data.model_dump()
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return _integration_to_response(integration)

@integrations_router.delete("/{integration_id}", status_code=204)
def delete_integration(integration_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.org_id == user.org_id
    ).first()
    if integration:
        db.delete(integration)
        db.commit()

def _integration_to_response(integration: Integration) -> IntegrationResponse:
    return IntegrationResponse(
        id=str(integration.id),
        org_id=str(integration.org_id),
        type=integration.type,
        name=integration.name,
        is_active=integration.is_active,
        last_verified_at=integration.last_verified_at.isoformat() if integration.last_verified_at else None,
        last_error=integration.last_error,
        daily_limit=integration.daily_limit,
        used_today=integration.used_today or 0,
        created_at=integration.created_at.isoformat()
    )

# ==================== DASHBOARD ROUTES ====================
dashboard_router = APIRouter()

@dashboard_router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_id = user.org_id

    # Get leads stats
    leads = db.query(Lead).filter(Lead.org_id == org_id).all()
    total_leads = len(leads)

    leads_by_status = {}
    leads_by_score = {"high": 0, "medium": 0, "low": 0}
    for lead in leads:
        status = lead.status or "new"
        leads_by_status[status] = leads_by_status.get(status, 0) + 1

        score = lead.score or 0
        if score >= 7:
            leads_by_score["high"] += 1
        elif score >= 4:
            leads_by_score["medium"] += 1
        else:
            leads_by_score["low"] += 1

    # Get this month's leads
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_leads = db.query(Lead).filter(
        Lead.org_id == org_id,
        Lead.created_at >= month_start
    ).count()

    # Get messages stats
    messages = db.query(Message).filter(Message.org_id == org_id).all()
    messages_sent = sum(1 for m in messages if m.status in ["sent", "delivered", "opened", "replied"])
    replies = sum(1 for m in messages if m.status == "replied")

    # Get active campaigns
    active_campaigns = db.query(Campaign).filter(
        Campaign.org_id == org_id,
        Campaign.status == "active"
    ).count()

    reply_rate = (replies / messages_sent * 100) if messages_sent > 0 else 0

    return DashboardStats(
        total_leads=total_leads,
        leads_this_month=month_leads,
        messages_sent=messages_sent,
        replies_received=replies,
        reply_rate=round(reply_rate, 1),
        active_campaigns=active_campaigns,
        leads_by_status=leads_by_status,
        leads_by_score=leads_by_score
    )

@dashboard_router.get("/activity", response_model=List[ActivityItem])
def get_activity(limit: int = Query(20, le=50), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activities = db.query(ActivityLog).filter(
        ActivityLog.org_id == user.org_id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    return [
        ActivityItem(
            id=str(a.id),
            action=a.action,
            entity_type=a.entity_type,
            entity_id=str(a.entity_id) if a.entity_id else None,
            details=a.details,
            created_at=a.created_at.isoformat()
        )
        for a in activities
    ]

# ==================== AI ROUTES ====================
ai_router = APIRouter()

@ai_router.post("/generate-message", response_model=GenerateMessageResponse)
def generate_message(data: GenerateMessageRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.ai_service import get_ai_service

    # Get lead
    lead = db.query(Lead).filter(Lead.id == data.lead_id, Lead.org_id == user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="العميل المحتمل غير موجود")

    # Get company profile
    profile = db.query(CompanyProfile).filter(CompanyProfile.org_id == user.org_id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="يرجى إعداد ملف الشركة أولاً")

    # Convert to dict for AI service
    lead_dict = {
        "company_name": lead.company_name,
        "company_name_ar": lead.company_name_ar,
        "contact_name": lead.contact_name,
        "contact_title": lead.contact_title,
        "industry": lead.industry,
        "website": lead.website,
        "funding_amount": lead.funding_amount,
        "funding_stage": lead.funding_stage,
        "employee_count": lead.employee_count,
        "location": lead.location
    }

    profile_dict = {
        "company_name": profile.company_name,
        "company_name_ar": profile.company_name_ar,
        "value_proposition": profile.value_proposition,
        "value_proposition_ar": profile.value_proposition_ar,
        "target_audience": profile.target_audience,
        "pain_points": profile.pain_points,
        "differentiators": profile.differentiators,
        "tone": profile.tone,
        "language": profile.language,
        "sdr_script": profile.sdr_script,
        "sdr_script_ar": profile.sdr_script_ar
    }

    # Generate message
    ai = get_ai_service()
    result = ai.generate_outreach_message(
        lead=lead_dict,
        company_profile=profile_dict,
        channel=data.channel.value,
        custom_context=data.custom_context
    )

    # Log activity
    activity = ActivityLog(
        org_id=user.org_id,
        user_id=user.id,
        action="ai.message_generated",
        entity_type="lead",
        entity_id=data.lead_id,
        details={"channel": data.channel.value, "tokens": result.get("tokens_used", 0)}
    )
    db.add(activity)
    db.commit()

    return GenerateMessageResponse(**result)

@ai_router.post("/score-lead", response_model=ScoreLeadResponse)
def score_lead(data: ScoreLeadRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.ai_service import get_ai_service

    lead = db.query(Lead).filter(Lead.id == data.lead_id, Lead.org_id == user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="العميل المحتمل غير موجود")

    lead_dict = {
        "company_name": lead.company_name,
        "industry": lead.industry,
        "funding_amount": lead.funding_amount,
        "funding_stage": lead.funding_stage,
        "employee_count": lead.employee_count,
        "website": lead.website
    }

    ai = get_ai_service()
    result = ai.score_lead(lead_dict)

    # Update lead score
    lead.score = result["score"]
    lead.score_breakdown = result["breakdown"]
    db.commit()

    return ScoreLeadResponse(**result)

@ai_router.post("/analyze-response", response_model=AnalyzeResponseResponse)
def analyze_response(data: AnalyzeResponseRequest, user: User = Depends(get_current_user)):
    from app.services.ai_service import get_ai_service

    ai = get_ai_service()
    result = ai.analyze_response(data.message, data.context)

    return AnalyzeResponseResponse(**result)

# Export all routers
router = APIRouter()
