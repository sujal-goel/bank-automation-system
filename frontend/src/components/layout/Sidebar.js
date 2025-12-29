/**
 * Dashboard Sidebar Component
 * Navigation sidebar with role-based menu items
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  BellIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const navigationItems = {
  customer: [
    { name: 'Dashboard', href: '/customer/dashboard', icon: HomeIcon },
    { name: 'Accounts', href: '/customer/accounts', icon: CreditCardIcon },
    { name: 'Applications', href: '/customer/applications', icon: DocumentTextIcon },
    { name: 'Documents', href: '/customer/documents', icon: CloudArrowUpIcon },
    { name: 'Notifications', href: '/customer/notifications', icon: BellIcon },
  ],
  employee: [
    { name: 'Workspace', href: '/employee/workspace', icon: HomeIcon },
    { name: 'Tasks', href: '/employee/tasks', icon: DocumentTextIcon },
    { name: 'Review', href: '/employee/review', icon: DocumentTextIcon },
    { name: 'Reports', href: '/employee/reports', icon: ChartBarIcon },
    { name: 'Processes', href: '/employee/processes', icon: CogIcon },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
    { name: 'System', href: '/admin/system', icon: CogIcon },
    { name: 'Security', href: '/admin/security', icon: ShieldCheckIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Audit Logs', href: '/admin/audit', icon: DocumentTextIcon },
  ],
};

export default function Sidebar({ userRole, isOpen, onClose }) {
  const pathname = usePathname();
  const navigation = navigationItems[userRole] || [];

  const isActive = (href) => {
    if (href === '/customer/dashboard' && pathname === '/customer/dashboard') return true;
    if (href === '/employee/workspace' && pathname === '/employee/workspace') return true;
    if (href === '/admin/dashboard' && pathname === '/admin/dashboard') return true;
    return pathname.startsWith(href) && href !== '/customer/dashboard' && href !== '/employee/workspace' && href !== '/admin/dashboard';
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-blue-600">SecureBank</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                          }`}
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          {/* Header with close button */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600">SecureBank</h1>
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                          }`}
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}