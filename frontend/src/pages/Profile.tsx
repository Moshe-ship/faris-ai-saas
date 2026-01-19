import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profile as profileApi } from '../lib/api';
import { Save, Loader2 } from 'lucide-react';

export default function Profile() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    company_name: '',
    company_name_ar: '',
    industry: '',
    website: '',
    value_proposition: '',
    value_proposition_ar: '',
    target_audience: '',
    pain_points: [] as string[],
    differentiators: [] as string[],
    tone: 'professional',
    language: 'mixed',
    sdr_script: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get().then(res => res.data),
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        company_name_ar: profile.company_name_ar || '',
        industry: profile.industry || '',
        website: profile.website || '',
        value_proposition: profile.value_proposition || '',
        value_proposition_ar: profile.value_proposition_ar || '',
        target_audience: profile.target_audience || '',
        pain_points: profile.pain_points || [],
        differentiators: profile.differentiators || [],
        tone: profile.tone || 'professional',
        language: profile.language || 'mixed',
        sdr_script: profile.sdr_script || '',
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('تم حفظ الملف بنجاح');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleArrayField = (field: 'pain_points' | 'differentiators', value: string) => {
    const items = value.split('\n').filter(i => i.trim());
    setFormData({ ...formData, [field]: items });
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-neutral-200 rounded-xl" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">ملف الشركة</h1>
        <p className="text-neutral-600">هذه المعلومات ستستخدم لتخصيص رسائل المبيعات</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 space-y-4">
          <h2 className="font-semibold text-neutral-900">المعلومات الأساسية</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">اسم الشركة (إنجليزي)</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">اسم الشركة (عربي)</label>
              <input
                type="text"
                value={formData.company_name_ar}
                onChange={(e) => setFormData({ ...formData, company_name_ar: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">المجال</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر المجال</option>
                <option value="technology">تقنية</option>
                <option value="fintech">تقنية مالية</option>
                <option value="ecommerce">تجارة إلكترونية</option>
                <option value="healthcare">صحة</option>
                <option value="education">تعليم</option>
                <option value="real_estate">عقارات</option>
                <option value="consulting">استشارات</option>
                <option value="marketing">تسويق</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">الموقع الإلكتروني</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                dir="ltr"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 space-y-4">
          <h2 className="font-semibold text-neutral-900">عرض القيمة</h2>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">ماذا تقدم شركتك؟</label>
            <textarea
              value={formData.value_proposition}
              onChange={(e) => setFormData({ ...formData, value_proposition: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24"
              placeholder="نحن نساعد الشركات على..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">من هو جمهورك المستهدف؟</label>
            <input
              type="text"
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="الشركات الناشئة في مجال التقنية"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">المشاكل التي تحلها (سطر لكل مشكلة)</label>
            <textarea
              value={formData.pain_points.join('\n')}
              onChange={(e) => handleArrayField('pain_points', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24"
              placeholder="صعوبة الوصول للعملاء&#10;ضعف معدل التحويل&#10;إهدار الوقت في المهام اليدوية"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">ما يميزك عن المنافسين (سطر لكل ميزة)</label>
            <textarea
              value={formData.differentiators.join('\n')}
              onChange={(e) => handleArrayField('differentiators', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24"
              placeholder="تقنية ذكاء اصطناعي متقدمة&#10;فهم عميق للسوق السعودي&#10;دعم فني على مدار الساعة"
            />
          </div>
        </div>

        {/* Communication Style */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 space-y-4">
          <h2 className="font-semibold text-neutral-900">أسلوب التواصل</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">النبرة</label>
              <select
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="professional">محترف ومهني</option>
                <option value="friendly">ودود ودافئ</option>
                <option value="casual">غير رسمي</option>
                <option value="formal">رسمي جداً</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">اللغة</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="mixed">عربي + إنجليزي (مختلط)</option>
                <option value="ar">عربي فقط</option>
                <option value="en">إنجليزي فقط</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">نص المبيعات (اختياري)</label>
            <textarea
              value={formData.sdr_script}
              onChange={(e) => setFormData({ ...formData, sdr_script: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-32"
              placeholder="أي تعليمات إضافية للذكاء الاصطناعي عند كتابة الرسائل..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>حفظ التغييرات</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
