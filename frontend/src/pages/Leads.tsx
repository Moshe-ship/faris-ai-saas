import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { leads as leadsApi, ai } from '../lib/api';
import { Search, Plus, Upload, Filter, MoreVertical, Sparkles, Mail, Linkedin } from 'lucide-react';
import type { Lead } from '../types';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? 'score-high' : score >= 4 ? 'score-medium' : 'score-low';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
      {score}/10
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    new: 'جديد',
    contacted: 'تم التواصل',
    replied: 'رد',
    meeting_scheduled: 'اجتماع',
    converted: 'تحويل',
    not_interested: 'غير مهتم',
    archived: 'مؤرشف',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium status-${status}`}>
      {labels[status] || status}
    </span>
  );
}

export default function Leads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', { page, search, status: statusFilter }],
    queryFn: () => leadsApi.list({ page, search: search || undefined, status: statusFilter || undefined }).then(res => res.data),
  });

  const scoreMutation = useMutation({
    mutationFn: (leadId: string) => ai.scoreLead(leadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => leadsApi.import(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowImport(false);
      alert(`تم استيراد ${data.data.imported} عميل محتمل`);
    },
  });

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">العملاء المحتملين</h1>
          <p className="text-neutral-600">{data?.total || 0} عميل محتمل</p>
        </div>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>استيراد CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <Link
            to="/app/leads/new"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">كل الحالات</option>
          <option value="new">جديد</option>
          <option value="contacted">تم التواصل</option>
          <option value="replied">رد</option>
          <option value="converted">تحويل</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">الشركة</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">المجال</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">التقييم</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">الحالة</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-neutral-200 rounded w-32" /></td>
                  <td className="px-4 py-4"><div className="h-4 bg-neutral-200 rounded w-20" /></td>
                  <td className="px-4 py-4"><div className="h-6 bg-neutral-200 rounded w-12" /></td>
                  <td className="px-4 py-4"><div className="h-6 bg-neutral-200 rounded w-16" /></td>
                  <td className="px-4 py-4"><div className="h-8 bg-neutral-200 rounded w-24" /></td>
                </tr>
              ))
            ) : data?.leads?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                  لا يوجد عملاء محتملين. ابدأ بإضافة أو استيراد بيانات.
                </td>
              </tr>
            ) : (
              data?.leads?.map((lead: Lead) => (
                <tr key={lead.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-4">
                    <Link to={`/app/leads/${lead.id}`} className="font-medium text-neutral-900 hover:text-primary-500">
                      {lead.company_name}
                    </Link>
                    {lead.contact_name && (
                      <p className="text-sm text-neutral-500">{lead.contact_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-neutral-600">{lead.industry || '-'}</td>
                  <td className="px-4 py-4">
                    <ScoreBadge score={lead.score} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => scoreMutation.mutate(lead.id)}
                        disabled={scoreMutation.isPending}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title="تقييم بالذكاء الاصطناعي"
                      >
                        <Sparkles className="w-4 h-4 text-secondary-500" />
                      </button>
                      <Link to={`/app/leads/${lead.id}`} className="p-2 hover:bg-neutral-100 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-neutral-400" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              صفحة {data.page} من {data.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
