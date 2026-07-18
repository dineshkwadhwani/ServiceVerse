import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Settings, Users, ShoppingCart, BarChart3, X } from 'lucide-react';
import { USER_ROLES } from '@/utils/constants';

interface SidebarProps {
  isOpen: boolean;
  onToggle?: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/dashboard',
      roles: [
        USER_ROLES.SUPERADMIN,
        USER_ROLES.ACCOUNT_MANAGER,
        USER_ROLES.SERVICE_PROVIDER,
        USER_ROLES.COWORKER,
        USER_ROLES.CUSTOMER,
      ],
    },
    {
      label: 'Services',
      icon: <Settings className="w-5 h-5" />,
      path: '/superadmin/services',
      roles: [USER_ROLES.SUPERADMIN],
    },
    {
      label: 'Account Managers',
      icon: <Users className="w-5 h-5" />,
      path: '/superadmin/account-managers',
      roles: [USER_ROLES.SUPERADMIN],
    },
    {
      label: 'Service Providers',
      icon: <Users className="w-5 h-5" />,
      path: '/account-manager/service-providers',
      roles: [USER_ROLES.ACCOUNT_MANAGER],
    },
    {
      label: 'Orders',
      icon: <ShoppingCart className="w-5 h-5" />,
      path: '/service-provider/orders',
      roles: [USER_ROLES.SERVICE_PROVIDER, USER_ROLES.COWORKER, USER_ROLES.CUSTOMER],
    },
    {
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/analytics',
      roles: [USER_ROLES.SUPERADMIN, USER_ROLES.ACCOUNT_MANAGER, USER_ROLES.SERVICE_PROVIDER],
    },
  ];

  // Filter nav items based on user role
  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onToggle}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">ServiceVerse</h2>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg transition
                  ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center">
            <p>© 2025 ServiceVerse</p>
          </div>
        </div>
      </aside>
    </>
  );
}
