import { useQuery } from '@tanstack/react-query';
import { campaigns as campaignsApi } from '../lib/api';
import { Plus, Play, Pause, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Campaigns() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list().then(res => res.data),
  });

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-600',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  const statusLabels: Record<string, string> = {
    draft: 'مسودة',
    active: 'نشطة',
    paused: 'متوقفة',
    completed: 'مكتملة',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">الحملات</h1>
          <p className="text-neutral-600">إدارة حملات التواصل الآلي</p>
        </div>
        <Link
          to="/app/campaigns/new"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>حملة جديدة</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : campaigns?.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-neutral-200">
          <p className="text-neutral-600 mb-4">لا توجد حملات بعد</p>
          <Link
            to="/app/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            إنشاء أول حملة
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns?.map((campaign: any) => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl p-6 border border-neutral-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-neutral-900">{campaign.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}>
                      {statusLabels[campaign.status]}
                    </span>
                  </div>
                  <p className="text-neutral-600 text-sm mt-1">{campaign.description || 'بدون وصف'}</p>
                </div>
                <button className="p-2 hover:bg-neutral-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">العملاء المستهدفين</p>
                  <p className="font-medium">{campaign.leads_contacted}</p>
                </div>
                <div>
                  <p className="text-neutral-500">الردود</p>
                  <p className="font-medium">{campaign.replies_received}</p>
                </div>
                <div>
                  <p className="text-neutral-500">الاجتماعات</p>
                  <p className="font-medium">{campaign.meetings_booked}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {campaign.channels?.map((channel: string) => (
                  <span key={channel} className="px-2 py-1 bg-neutral-100 rounded text-xs">
                    {channel}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
