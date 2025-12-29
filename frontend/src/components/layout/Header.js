/**
 * Dashboard Header Component
 * Mobile-optimized top navigation bar with user menu and mobile menu toggle
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth, useLogout } from '@/lib/auth/auth-hooks';

export default function Header({ onMenuClick }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user } = useAuth();
  const { logoutWithRedirect } = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutWithRedirect('/');
  };

  const handleProfile = () => {
    router.push('/profile');
    setUserMenuOpen(false);
  };

  const handleSettings = () => {
    router.push('/settings');
    setUserMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 safe-area-top">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            onClick={onMenuClick}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Logo/Title for mobile */}
          <div className="lg:hidden">
            <h1 className="text-xl font-semibold text-gray-900">SecureBank</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 relative transition-colors"
            >
              <BellIcon className="h-6 w-6" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                className="touch-target flex items-center space-x-2 sm:space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium truncate max-w-24 lg:max-w-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 mobile-fade-in">
                  <div className="py-1">
                    {/* Mobile: Show user info in dropdown */}
                    <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    
                    <button
                      onClick={handleProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 touch-target transition-colors"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={handleSettings}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 touch-target transition-colors"
                    >
                      Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 touch-target transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
}