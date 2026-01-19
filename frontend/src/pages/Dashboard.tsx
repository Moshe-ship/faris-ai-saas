import { useQuery } from '@tanstack/react-query';
import { dashboard } from '../lib/api';
import { Users, MessageSquare, Reply, Megaphone, TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

function StatCard({ title, value, icon: Icon, trend, color }: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neutral-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboard.stats().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-neutral-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalLeads = stats?.total_leads || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">مرحباً 👋</h1>
        <p className="text-neutral-600">إليك نظرة عامة على أداء مبيعاتك</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="العملاء المحتملين"
          value={stats?.total_leads || 0}
          icon={Users}
          color="bg-primary-500"
        />
        <StatCard
          title="الرسائل المرسلة"
          value={stats?.messages_sent || 0}
          icon={MessageSquare}
          color="bg-blue-500"
        />
        <StatCard
          title="الردود"
          value={stats?.replies_received || 0}
          icon={Reply}
          color="bg-green-500"
        />
        <StatCard
          title="الحملات النشطة"
          value={stats?.active_campaigns || 0}
          icon={Megaphone}
          color="bg-secondary-500"
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Score */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 className="font-semibold text-neutral-900 mb-4">العملاء حسب التقييم</h3>
          <div className="space-y-4">
            <ScoreBar
              label="تقييم عالي (7-10)"
              count={stats?.leads_by_score?.high || 0}
              total={totalLeads}
              color="bg-green-500"
            />
            <ScoreBar
              label="تقييم متوسط (4-6)"
              count={stats?.leads_by_score?.medium || 0}
              total={totalLeads}
              color="bg-yellow-500"
            />
            <ScoreBar
              label="تقييم منخفض (0-3)"
              count={stats?.leads_by_score?.low || 0}
              total={totalLeads}
              color="bg-neutral-400"
            />
          </div>
        </div>

        {/* Leads by Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 className="font-semibold text-neutral-900 mb-4">العملاء حسب الحالة</h3>
          <div className="space-y-3">
            {Object.entries(stats?.leads_by_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-neutral-600 capitalize">
                  {status === 'new' && 'جديد'}
                  {status === 'contacted' && 'تم التواصل'}
                  {status === 'replied' && 'رد'}
                  {status === 'converted' && 'تحويل'}
                  {status === 'archived' && 'مؤرشف'}
                </span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reply Rate */}
      <div className="bg-gradient-to-l from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100">معدل الرد</p>
            <p className="text-4xl font-bold mt-1">{stats?.reply_rate || 0}%</p>
          </div>
          <div className="text-6xl opacity-20">📈</div>
        </div>
      </div>
    </div>
  );
}
