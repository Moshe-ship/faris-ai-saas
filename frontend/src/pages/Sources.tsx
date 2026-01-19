import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sources as sourcesApi } from '../lib/api';
import { Plus, Database, Check, Globe } from 'lucide-react';
import type { DataSource, IndustrySource } from '../types';

export default function Sources() {
  const queryClient = useQueryClient();

  const { data: industrySources } = useQuery({
    queryKey: ['industry-sources'],
    queryFn: () => sourcesApi.listIndustries().then(res => res.data),
  });

  const { data: mySources } = useQuery({
    queryKey: ['my-sources'],
    queryFn: () => sourcesApi.list().then(res => res.data),
  });

  const enableMutation = useMutation({
    mutationFn: (id: string) => sourcesApi.enableIndustry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-sources'] });
    },
  });

  const enabledIds = new Set(mySources?.map((s: DataSource) => s.industry_source_id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">مصادر البيانات</h1>
        <p className="text-neutral-600">اختر مصادر البيانات لجمع العملاء المحتملين</p>
      </div>

      {/* My Sources */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h2 className="font-semibold text-neutral-900 mb-4">مصادري النشطة</h2>
        {mySources?.length === 0 ? (
          <p className="text-neutral-500 text-sm">لم تقم بتفعيل أي مصدر بعد</p>
        ) : (
          <div className="space-y-3">
            {mySources?.map((source: DataSource) => (
              <div key={source.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-sm text-neutral-500">{source.leads_count} عميل محتمل</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">نشط</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Sources */}
      <div>
        <h2 className="font-semibold text-neutral-900 mb-4">المصادر المتاحة</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {industrySources?.map((source: IndustrySource) => {
            const isEnabled = enabledIds.has(source.id);
            return (
              <div
                key={source.id}
                className={`bg-white rounded-xl p-6 border ${isEnabled ? 'border-primary-200 bg-primary-50/30' : 'border-neutral-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">{source.name}</h3>
                      <p className="text-sm text-neutral-500">{source.name_ar}</p>
                    </div>
                  </div>
                  {isEnabled ? (
                    <span className="flex items-center gap-1 text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded">
                      <Check className="w-3 h-3" />
                      مفعل
                    </span>
                  ) : (
                    <button
                      onClick={() => enableMutation.mutate(source.id)}
                      disabled={enableMutation.isPending}
                      className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                    >
                      تفعيل
                    </button>
                  )}
                </div>
                <p className="mt-3 text-sm text-neutral-600">{source.description_ar || source.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs bg-neutral-100 px-2 py-1 rounded">{source.industry_ar || source.industry}</span>
                  <span className="text-xs bg-neutral-100 px-2 py-1 rounded">{source.region}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
