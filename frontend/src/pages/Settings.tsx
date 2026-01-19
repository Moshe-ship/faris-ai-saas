import { Link } from 'react-router-dom';
import { User, Building, Plug, CreditCard, Users } from 'lucide-react';

const settingsItems = [
  { name: 'ملف الشركة', description: 'إعداد معلومات شركتك وعرض القيمة', href: '/app/settings/profile', icon: Building },
  { name: 'التكاملات', description: 'ربط البريد الإلكتروني وLinkedIn وCRM', href: '/app/settings/integrations', icon: Plug },
  { name: 'الفريق', description: 'إدارة أعضاء الفريق والصلاحيات', href: '/app/settings/team', icon: Users },
  { name: 'الفواتير', description: 'إدارة الاشتراك والاستخدام', href: '/app/settings/billing', icon: CreditCard },
];

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">الإعدادات</h1>
        <p className="text-neutral-600">إدارة حسابك وتفضيلاتك</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="bg-white rounded-xl p-6 border border-neutral-200 hover:shadow-md hover:border-primary-200 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <item.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600">{item.name}</h3>
                <p className="text-sm text-neutral-600 mt-1">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
