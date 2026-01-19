"""
AI Service - Message generation, lead scoring, response analysis
Uses Anthropic Claude API
"""

from anthropic import Anthropic
from typing import Optional, Dict, Any
import json

from app.config import settings


class AIService:
    """AI service for generating personalized sales messages"""
    
    def __init__(self):
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.AI_MODEL
    
    def generate_outreach_message(
        self,
        lead: Dict[str, Any],
        company_profile: Dict[str, Any],
        channel: str,
        custom_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a personalized outreach message for a lead"""
        system_prompt = self._build_system_prompt(company_profile, channel)
        user_prompt = self._build_user_prompt(lead, channel, custom_context)
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        
        content = response.content[0].text
        tokens_used = response.usage.input_tokens + response.usage.output_tokens
        
        subject = None
        body = content
        
        if channel == "email" and "الموضوع:" in content:
            lines = content.split("\n")
            for i, line in enumerate(lines):
                if line.strip().startswith("الموضوع:"):
                    subject = line.replace("الموضوع:", "").strip()
                    body = "\n".join(lines[i+1:]).strip()
                    break
        
        return {
            "subject": subject,
            "body": body.strip(),
            "tokens_used": tokens_used,
            "personalization_data": {
                "company_name": lead.get("company_name"),
                "funding": lead.get("funding_amount"),
                "industry": lead.get("industry")
            }
        }
    
    def _build_system_prompt(self, profile: Dict[str, Any], channel: str) -> str:
        tone_map = {"professional": "محترف ومهني", "casual": "ودي وغير رسمي", "formal": "رسمي جداً", "friendly": "ودود ودافئ"}
        tone = tone_map.get(profile.get("tone", "professional"), "محترف")
        language = profile.get("language", "mixed")
        
        if language == "ar":
            lang_instruction = "اكتب بالعربية فقط."
        elif language == "en":
            lang_instruction = "Write in English only."
        else:
            lang_instruction = "اكتب بمزيج من العربية والإنجليزية بطريقة طبيعية للأعمال السعودية."
        
        channel_instructions = {
            "email": "رسالة بريد إلكتروني. ابدأ بـ 'الموضوع:' ثم الرسالة. 150-200 كلمة.",
            "linkedin": "رسالة LinkedIn قصيرة. أقل من 300 حرف. بدون موضوع.",
            "whatsapp": "رسالة WhatsApp قصيرة جداً. أقل من 200 حرف. بدون موضوع. إيموجي 1-2 فقط."
        }
        
        return f"""أنت مندوب مبيعات محترف في السعودية.

شركتك: {profile.get('company_name', 'شركتنا')}
ماذا تقدم: {profile.get('value_proposition', 'خدمات متميزة')}
الجمهور: {profile.get('target_audience', 'الشركات')}

{profile.get('sdr_script', '')}

النبرة: {tone}
{lang_instruction}
{channel_instructions.get(channel, '')}

قواعد: لا تكذب. كن مباشراً. احترم وقت المتلقي. اذكر شيئاً محدداً عن العميل."""
    
    def _build_user_prompt(self, lead: Dict[str, Any], channel: str, custom_context: Optional[str] = None) -> str:
        prompt = f"اكتب رسالة {channel} لـ:\n\nالشركة: {lead.get('company_name', 'غير معروف')}\n"
        
        for key, label in [('industry', 'المجال'), ('funding_amount', 'التمويل'), ('contact_name', 'جهة الاتصال')]:
            if lead.get(key):
                prompt += f"{label}: {lead[key]}\n"
        
        if custom_context:
            prompt += f"\nسياق: {custom_context}\n"
        
        return prompt + "\nاكتب الرسالة:"
    
    def score_lead(self, lead: Dict[str, Any]) -> Dict[str, Any]:
        """Score a lead 0-10"""
        score = 0
        breakdown = {}
        reasons = []
        
        # Funding (0-3)
        funding = lead.get('funding_amount', '').lower()
        if any(x in funding for x in ['million', 'مليون', 'series']):
            score += 3; breakdown['funding'] = 3; reasons.append("تمويل كبير")
        elif funding:
            score += 1; breakdown['funding'] = 1
        else:
            breakdown['funding'] = 0
        
        # Contact info (0-2)
        contact = sum([1 if lead.get('email') else 0, 1 if lead.get('phone') else 0])
        score += contact; breakdown['contact'] = contact
        if contact >= 2:
            reasons.append("معلومات اتصال كاملة")
        
        # Industry (0-2)
        industry = lead.get('industry', '').lower()
        if any(x in industry for x in ['fintech', 'ecommerce', 'saas', 'تقنية']):
            score += 2; breakdown['industry'] = 2; reasons.append("مجال عالي القيمة")
        elif industry:
            score += 1; breakdown['industry'] = 1
        else:
            breakdown['industry'] = 0
        
        # Base score
        score += 2
        breakdown['base'] = 2
        
        return {"score": min(round(score), 10), "breakdown": breakdown, "reasons": reasons}
    
    def analyze_response(self, message: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Analyze a response (Inshallah Decoder)"""
        prompt = f'''حلل هذا الرد وأجب بـ JSON فقط:
"{message}"

{{"sentiment": "positive/neutral/negative", "intent": "interested/maybe/not_interested", "inshallah_score": 1-10, "suggested_action": "...", "analysis": "..."}}'''

        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text
        try:
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(content[start:end])
        except:
            pass
        
        return {"sentiment": "neutral", "intent": "maybe", "inshallah_score": 5, "suggested_action": "تابع", "analysis": content}


_ai_service: Optional[AIService] = None

def get_ai_service() -> AIService:
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
