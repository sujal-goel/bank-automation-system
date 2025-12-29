/**
 * Responsive Layout Component
 * Handles mobile-first responsive layout with adaptive navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-hooks';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';

export default function ResponsiveLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen, isMobile]);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  if (!user) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar 
        userRole={user.role} 
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose} 
      />

      {/* Mobile Navigation */}
      <MobileNavigation 
        userRole={user.role} 
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose} 
      />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onMenuClick={handleMenuClick} />

        {/* Page Content */}
        <main className="flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Mobile-optimized content wrapper */}
            <div className="mx-auto max-w-7xl">
              {/* Add bottom padding for mobile bottom navigation */}
              <div className="pb-20 lg:pb-0">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}