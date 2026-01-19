import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ar' | 'en';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.dashboard': 'الرئيسية',
    'nav.leads': 'العملاء المحتملين',
    'nav.campaigns': 'الحملات',
    'nav.sources': 'مصادر البيانات',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',

    // Dashboard
    'dashboard.welcome': 'مرحباً',
    'dashboard.overview': 'إليك نظرة عامة على أداء مبيعاتك',
    'dashboard.leads': 'العملاء المحتملين',
    'dashboard.messagesSent': 'الرسائل المرسلة',
    'dashboard.replies': 'الردود',
    'dashboard.activeCampaigns': 'الحملات النشطة',
    'dashboard.leadsByScore': 'العملاء حسب التقييم',
    'dashboard.leadsByStatus': 'العملاء حسب الحالة',
    'dashboard.replyRate': 'معدل الرد',
    'dashboard.highScore': 'تقييم عالي (7-10)',
    'dashboard.mediumScore': 'تقييم متوسط (4-6)',
    'dashboard.lowScore': 'تقييم منخفض (0-3)',

    // Status labels
    'status.new': 'جديد',
    'status.contacted': 'تم التواصل',
    'status.replied': 'رد',
    'status.converted': 'تحويل',
    'status.archived': 'مؤرشف',

    // Leads
    'leads.title': 'العملاء المحتملين',
    'leads.count': 'عميل محتمل',
    'leads.import': 'استيراد CSV',
    'leads.add': 'إضافة عميل',
    'leads.search': 'بحث...',
    'leads.allStatuses': 'كل الحالات',
    'leads.company': 'الشركة',
    'leads.industry': 'المجال',
    'leads.score': 'التقييم',
    'leads.status': 'الحالة',
    'leads.actions': 'إجراءات',
    'leads.noLeads': 'لا يوجد عملاء محتملين. ابدأ بإضافة أو استيراد بيانات.',
    'leads.previous': 'السابق',
    'leads.next': 'التالي',
    'leads.page': 'صفحة',
    'leads.of': 'من',

    // Lead Detail
    'lead.info': 'معلومات الشركة',
    'lead.contact': 'معلومات الاتصال',
    'lead.generateMessage': 'إنشاء رسالة',
    'lead.scoreNow': 'تقييم الآن',
    'lead.notes': 'ملاحظات',
    'lead.saveLead': 'حفظ التغييرات',
    'lead.email': 'البريد الإلكتروني',
    'lead.phone': 'الهاتف',
    'lead.linkedin': 'LinkedIn',
    'lead.website': 'الموقع',
    'lead.funding': 'التمويل',
    'lead.employees': 'الموظفين',
    'lead.location': 'الموقع الجغرافي',
    'lead.contactName': 'اسم جهة الاتصال',
    'lead.contactTitle': 'المسمى الوظيفي',

    // Campaigns
    'campaigns.title': 'الحملات',
    'campaigns.subtitle': 'إدارة حملات التواصل الآلي',
    'campaigns.new': 'حملة جديدة',
    'campaigns.noCampaigns': 'لا توجد حملات بعد',
    'campaigns.createFirst': 'إنشاء أول حملة',
    'campaigns.draft': 'مسودة',
    'campaigns.active': 'نشطة',
    'campaigns.paused': 'متوقفة',
    'campaigns.completed': 'مكتملة',
    'campaigns.targeted': 'العملاء المستهدفين',
    'campaigns.replies': 'الردود',
    'campaigns.meetings': 'الاجتماعات',
    'campaigns.noDescription': 'بدون وصف',

    // Sources
    'sources.title': 'مصادر البيانات',
    'sources.subtitle': 'اختر مصادر البيانات لجمع العملاء المحتملين',
    'sources.mySources': 'مصادري النشطة',
    'sources.noSources': 'لم تقم بتفعيل أي مصدر بعد',
    'sources.available': 'المصادر المتاحة',
    'sources.active': 'نشط',
    'sources.enabled': 'مفعل',
    'sources.enable': 'تفعيل',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.subtitle': 'إدارة حسابك وتفضيلاتك',
    'settings.profile': 'ملف الشركة',
    'settings.profileDesc': 'إعداد معلومات شركتك وعرض القيمة',
    'settings.integrations': 'التكاملات',
    'settings.integrationsDesc': 'ربط البريد الإلكتروني وLinkedIn وCRM',
    'settings.team': 'الفريق',
    'settings.teamDesc': 'إدارة أعضاء الفريق والصلاحيات',
    'settings.billing': 'الفواتير',
    'settings.billingDesc': 'إدارة الاشتراك والاستخدام',

    // Profile
    'profile.title': 'ملف الشركة',
    'profile.subtitle': 'هذه المعلومات ستستخدم لتخصيص رسائل المبيعات',
    'profile.basicInfo': 'المعلومات الأساسية',
    'profile.companyNameEn': 'اسم الشركة (إنجليزي)',
    'profile.companyNameAr': 'اسم الشركة (عربي)',
    'profile.industry': 'المجال',
    'profile.selectIndustry': 'اختر المجال',
    'profile.website': 'الموقع الإلكتروني',
    'profile.valueProp': 'عرض القيمة',
    'profile.whatYouOffer': 'ماذا تقدم شركتك؟',
    'profile.targetAudience': 'من هو جمهورك المستهدف؟',
    'profile.painPoints': 'المشاكل التي تحلها (سطر لكل مشكلة)',
    'profile.differentiators': 'ما يميزك عن المنافسين (سطر لكل ميزة)',
    'profile.commStyle': 'أسلوب التواصل',
    'profile.tone': 'النبرة',
    'profile.language': 'اللغة',
    'profile.sdrScript': 'نص المبيعات (اختياري)',
    'profile.save': 'حفظ التغييرات',
    'profile.saving': 'جاري الحفظ...',
    'profile.saved': 'تم حفظ الملف بنجاح',

    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.name': 'الاسم الكامل',
    'auth.companyName': 'اسم الشركة',
    'auth.loginBtn': 'دخول',
    'auth.registerBtn': 'إنشاء حساب',
    'auth.loggingIn': 'جاري الدخول...',
    'auth.registering': 'جاري التسجيل...',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.hasAccount': 'لديك حساب؟',
    'auth.signUp': 'سجل الآن',
    'auth.signIn': 'سجل دخول',
    'auth.tagline': 'منصة المبيعات الذكية',
    'auth.startJourney': 'ابدأ رحلة المبيعات الذكية',

    // AI
    'ai.generating': 'جاري إنشاء الرسالة...',
    'ai.scoring': 'جاري التقييم...',
    'ai.score': 'تقييم بالذكاء الاصطناعي',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.close': 'إغلاق',
    'common.back': 'رجوع',
    'common.language': 'اللغة',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.leads': 'Leads',
    'nav.campaigns': 'Campaigns',
    'nav.sources': 'Data Sources',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': "Here's an overview of your sales performance",
    'dashboard.leads': 'Leads',
    'dashboard.messagesSent': 'Messages Sent',
    'dashboard.replies': 'Replies',
    'dashboard.activeCampaigns': 'Active Campaigns',
    'dashboard.leadsByScore': 'Leads by Score',
    'dashboard.leadsByStatus': 'Leads by Status',
    'dashboard.replyRate': 'Reply Rate',
    'dashboard.highScore': 'High Score (7-10)',
    'dashboard.mediumScore': 'Medium Score (4-6)',
    'dashboard.lowScore': 'Low Score (0-3)',

    // Status labels
    'status.new': 'New',
    'status.contacted': 'Contacted',
    'status.replied': 'Replied',
    'status.converted': 'Converted',
    'status.archived': 'Archived',

    // Leads
    'leads.title': 'Leads',
    'leads.count': 'leads',
    'leads.import': 'Import CSV',
    'leads.add': 'Add Lead',
    'leads.search': 'Search...',
    'leads.allStatuses': 'All Statuses',
    'leads.company': 'Company',
    'leads.industry': 'Industry',
    'leads.score': 'Score',
    'leads.status': 'Status',
    'leads.actions': 'Actions',
    'leads.noLeads': 'No leads yet. Start by adding or importing data.',
    'leads.previous': 'Previous',
    'leads.next': 'Next',
    'leads.page': 'Page',
    'leads.of': 'of',

    // Lead Detail
    'lead.info': 'Company Info',
    'lead.contact': 'Contact Info',
    'lead.generateMessage': 'Generate Message',
    'lead.scoreNow': 'Score Now',
    'lead.notes': 'Notes',
    'lead.saveLead': 'Save Changes',
    'lead.email': 'Email',
    'lead.phone': 'Phone',
    'lead.linkedin': 'LinkedIn',
    'lead.website': 'Website',
    'lead.funding': 'Funding',
    'lead.employees': 'Employees',
    'lead.location': 'Location',
    'lead.contactName': 'Contact Name',
    'lead.contactTitle': 'Job Title',

    // Campaigns
    'campaigns.title': 'Campaigns',
    'campaigns.subtitle': 'Manage automated outreach campaigns',
    'campaigns.new': 'New Campaign',
    'campaigns.noCampaigns': 'No campaigns yet',
    'campaigns.createFirst': 'Create First Campaign',
    'campaigns.draft': 'Draft',
    'campaigns.active': 'Active',
    'campaigns.paused': 'Paused',
    'campaigns.completed': 'Completed',
    'campaigns.targeted': 'Targeted Leads',
    'campaigns.replies': 'Replies',
    'campaigns.meetings': 'Meetings',
    'campaigns.noDescription': 'No description',

    // Sources
    'sources.title': 'Data Sources',
    'sources.subtitle': 'Choose data sources to collect leads',
    'sources.mySources': 'My Active Sources',
    'sources.noSources': 'No sources enabled yet',
    'sources.available': 'Available Sources',
    'sources.active': 'Active',
    'sources.enabled': 'Enabled',
    'sources.enable': 'Enable',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account and preferences',
    'settings.profile': 'Company Profile',
    'settings.profileDesc': 'Set up your company info and value proposition',
    'settings.integrations': 'Integrations',
    'settings.integrationsDesc': 'Connect email, LinkedIn, and CRM',
    'settings.team': 'Team',
    'settings.teamDesc': 'Manage team members and permissions',
    'settings.billing': 'Billing',
    'settings.billingDesc': 'Manage subscription and usage',

    // Profile
    'profile.title': 'Company Profile',
    'profile.subtitle': 'This information will be used to personalize sales messages',
    'profile.basicInfo': 'Basic Information',
    'profile.companyNameEn': 'Company Name (English)',
    'profile.companyNameAr': 'Company Name (Arabic)',
    'profile.industry': 'Industry',
    'profile.selectIndustry': 'Select Industry',
    'profile.website': 'Website',
    'profile.valueProp': 'Value Proposition',
    'profile.whatYouOffer': 'What does your company offer?',
    'profile.targetAudience': 'Who is your target audience?',
    'profile.painPoints': 'Problems you solve (one per line)',
    'profile.differentiators': 'What differentiates you (one per line)',
    'profile.commStyle': 'Communication Style',
    'profile.tone': 'Tone',
    'profile.language': 'Language',
    'profile.sdrScript': 'Sales Script (optional)',
    'profile.save': 'Save Changes',
    'profile.saving': 'Saving...',
    'profile.saved': 'Profile saved successfully',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Create Account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.companyName': 'Company Name',
    'auth.loginBtn': 'Login',
    'auth.registerBtn': 'Create Account',
    'auth.loggingIn': 'Logging in...',
    'auth.registering': 'Creating account...',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.signUp': 'Sign up',
    'auth.signIn': 'Sign in',
    'auth.tagline': 'Smart Sales Platform',
    'auth.startJourney': 'Start your smart sales journey',

    // AI
    'ai.generating': 'Generating message...',
    'ai.scoring': 'Scoring...',
    'ai.score': 'AI Score',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.language': 'Language',
  },
};

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'ar',
      setLanguage: (lang) => {
        set({ language: lang });
        // Update document direction
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      },
      t: (key) => {
        const lang = get().language;
        return translations[lang][key] || key;
      },
    }),
    {
      name: 'faris-language',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = state.language;
        }
      },
    }
  )
);
