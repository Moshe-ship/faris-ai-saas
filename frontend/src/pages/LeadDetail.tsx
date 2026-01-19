import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leads as leadsApi, ai } from '../lib/api';
import { useI18n } from '../lib/i18n';
import type { Lead } from '../types';
import {
  ArrowRight,
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Globe,
  Linkedin,
  DollarSign,
  Users,
  MapPin,
  Sparkles,
  MessageSquare,
  Save,
  Loader2,
  Send,
  Copy,
  Check,
} from 'lucide-react';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? 'score-high' : score >= 4 ? 'score-medium' : 'score-low';
  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${color}`}>
      {score}/10
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const labels: Record<string, string> = {
    new: t('status.new'),
    contacted: t('status.contacted'),
    replied: t('status.replied'),
    meeting_scheduled: 'Meeting',
    converted: t('status.converted'),
    not_interested: 'Not Interested',
    archived: t('status.archived'),
  };
  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium status-${status}`}>
      {labels[status] || status}
    </span>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language } = useI18n();
  const isRTL = language === 'ar';

  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState<{ subject?: string; body: string } | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'linkedin' | 'whatsapp'>('email');
  const [copied, setCopied] = useState(false);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id!).then(res => res.data),
    enabled: !!id,
  });

  // Sync form state with fetched data
  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
      setStatus(lead.status || 'new');
    }
  }, [lead]);

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; notes?: string }) => leadsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const scoreMutation = useMutation({
    mutationFn: () => ai.scoreLead(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: (channel: string) => ai.generateMessage({ lead_id: id!, channel }),
    onSuccess: (data) => {
      setGeneratedMessage(data.data);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ status, notes });
  };

  const handleGenerateMessage = () => {
    generateMutation.mutate(selectedChannel);
  };

  const handleCopyMessage = () => {
    if (generatedMessage) {
      const text = generatedMessage.subject
        ? `${generatedMessage.subject}\n\n${generatedMessage.body}`
        : generatedMessage.body;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-neutral-200 rounded-xl" />
          <div className="h-64 bg-neutral-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">{language === 'ar' ? 'العميل المحتمل غير موجود' : 'Lead not found'}</p>
        <Link to="/app/leads" className="text-primary-500 hover:underline mt-2 inline-block">
          {language === 'ar' ? 'العودة للقائمة' : 'Back to leads'}
        </Link>
      </div>
    );
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/leads')}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{lead.company_name}</h1>
            {lead.company_name_ar && lead.company_name_ar !== lead.company_name && (
              <p className="text-neutral-600">{lead.company_name_ar}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={lead.score || 0} />
          <StatusBadge status={lead.status || 'new'} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 space-y-4">
          <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-primary-500" />
            {t('lead.info')}
          </h2>

          <div className="space-y-3">
            {lead.industry && (
              <div className="flex items-center gap-3 text-neutral-600">
                <span className="text-sm font-medium w-24">{t('leads.industry')}:</span>
                <span>{lead.industry}</span>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-neutral-400" />
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                  {lead.website}
                </a>
              </div>
            )}
            {lead.funding_amount && (
              <div className="flex items-center gap-3 text-neutral-600">
                <DollarSign className="w-4 h-4 text-neutral-400" />
                <span>{lead.funding_amount}</span>
                {lead.funding_stage && <span className="text-neutral-400">({lead.funding_stage})</span>}
              </div>
            )}
            {lead.employee_count && (
              <div className="flex items-center gap-3 text-neutral-600">
                <Users className="w-4 h-4 text-neutral-400" />
                <span>{lead.employee_count} {language === 'ar' ? 'موظف' : 'employees'}</span>
              </div>
            )}
            {lead.location && (
              <div className="flex items-center gap-3 text-neutral-600">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <span>{lead.location}</span>
              </div>
            )}
          </div>

          {/* Score section */}
          <div className="pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">{t('ai.score')}</span>
              <button
                onClick={() => scoreMutation.mutate()}
                disabled={scoreMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 disabled:opacity-50"
              >
                {scoreMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {t('lead.scoreNow')}
              </button>
            </div>
            {lead.score_breakdown && Object.keys(lead.score_breakdown).length > 0 && (
              <div className="mt-3 space-y-1 text-sm">
                {Object.entries(lead.score_breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-neutral-600">
                    <span className="capitalize">{key}</span>
                    <span className="font-medium">+{value as number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 space-y-4">
          <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            {t('lead.contact')}
          </h2>

          <div className="space-y-3">
            {lead.contact_name && (
              <div className="flex items-center gap-3 text-neutral-600">
                <span className="text-sm font-medium w-24">{t('lead.contactName')}:</span>
                <span>{lead.contact_name}</span>
              </div>
            )}
            {lead.contact_title && (
              <div className="flex items-center gap-3 text-neutral-600">
                <span className="text-sm font-medium w-24">{t('lead.contactTitle')}:</span>
                <span>{lead.contact_title}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-neutral-400" />
                <a href={`mailto:${lead.email}`} className="text-primary-500 hover:underline">
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-neutral-400" />
                <a href={`tel:${lead.phone}`} className="text-primary-500 hover:underline" dir="ltr">
                  {lead.phone}
                </a>
              </div>
            )}
            {lead.linkedin_url && (
              <div className="flex items-center gap-3">
                <Linkedin className="w-4 h-4 text-neutral-400" />
                <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                  LinkedIn
                </a>
              </div>
            )}
          </div>

          {/* Status and Notes */}
          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('leads.status')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="new">{t('status.new')}</option>
                <option value="contacted">{t('status.contacted')}</option>
                <option value="replied">{t('status.replied')}</option>
                <option value="converted">{t('status.converted')}</option>
                <option value="archived">{t('status.archived')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('lead.notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24"
                placeholder={language === 'ar' ? 'أضف ملاحظاتك هنا...' : 'Add your notes here...'}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('lead.saveLead')}
            </button>
          </div>
        </div>
      </div>

      {/* AI Message Generator */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h2 className="font-semibold text-neutral-900 flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-secondary-500" />
          {t('lead.generateMessage')}
        </h2>

        <div className="flex flex-wrap gap-3 mb-4">
          {(['email', 'linkedin', 'whatsapp'] as const).map((channel) => (
            <button
              key={channel}
              onClick={() => setSelectedChannel(channel)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedChannel === channel
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
            >
              {channel === 'email' && <Mail className="w-4 h-4 inline mr-2" />}
              {channel === 'linkedin' && <Linkedin className="w-4 h-4 inline mr-2" />}
              {channel === 'whatsapp' && <MessageSquare className="w-4 h-4 inline mr-2" />}
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerateMessage}
          disabled={generateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('ai.generating')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t('lead.generateMessage')}
            </>
          )}
        </button>

        {generatedMessage && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            {generatedMessage.subject && (
              <div className="mb-3">
                <span className="text-sm font-medium text-neutral-700">
                  {language === 'ar' ? 'الموضوع:' : 'Subject:'}
                </span>
                <p className="text-neutral-900 mt-1">{generatedMessage.subject}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-neutral-700">
                {language === 'ar' ? 'الرسالة:' : 'Message:'}
              </span>
              <p className="text-neutral-900 mt-1 whitespace-pre-wrap">{generatedMessage.body}</p>
            </div>
            <button
              onClick={handleCopyMessage}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm bg-neutral-200 hover:bg-neutral-300 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  {language === 'ar' ? 'تم النسخ!' : 'Copied!'}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {language === 'ar' ? 'نسخ الرسالة' : 'Copy Message'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
