/**
 * Mobile Navigation Component
 * Provides hamburger menu and bottom tab navigation for mobile devices
 * Includes swipe gestures for enhanced mobile interaction
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSwipeGestures from '../../hooks/useSwipeGestures';
import { 
  Bars3Icon, 
  XMarkIcon,
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
import { 
  HomeIcon as HomeIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CloudArrowUpIcon as CloudArrowUpIconSolid,
  BellIcon as BellIconSolid,
} from '@heroicons/react/24/solid';

const navigationItems = {
  customer: [
    { 
      name: 'Dashboard', 
      href: '/customer/dashboard', 
      icon: HomeIcon, 
      iconSolid: HomeIconSolid,
      shortName: 'Home',
    },
    { 
      name: 'Accounts', 
      href: '/customer/accounts', 
      icon: CreditCardIcon, 
      iconSolid: CreditCardIconSolid,
      shortName: 'Accounts',
    },
    { 
      name: 'Applications', 
      href: '/customer/applications', 
      icon: DocumentTextIcon, 
      iconSolid: DocumentTextIconSolid,
      shortName: 'Apply',
    },
    { 
      name: 'Documents', 
      href: '/customer/documents', 
      icon: CloudArrowUpIcon, 
      iconSolid: CloudArrowUpIconSolid,
      shortName: 'Docs',
    },
    { 
      name: 'Notifications', 
      href: '/customer/notifications', 
      icon: BellIcon, 
      iconSolid: BellIconSolid,
      shortName: 'Alerts',
    },
  ],
  employee: [
    { name: 'Workspace', href: '/employee/workspace', icon: HomeIcon, shortName: 'Home' },
    { name: 'Tasks', href: '/employee/tasks', icon: DocumentTextIcon, shortName: 'Tasks' },
    { name: 'Review', href: '/employee/review', icon: DocumentTextIcon, shortName: 'Review' },
    { name: 'Reports', href: '/employee/reports', icon: ChartBarIcon, shortName: 'Reports' },
    { name: 'Processes', href: '/employee/processes', icon: CogIcon, shortName: 'Process' },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon, shortName: 'Home' },
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon, shortName: 'Users' },
    { name: 'System', href: '/admin/system', icon: CogIcon, shortName: 'System' },
    { name: 'Security', href: '/admin/security', icon: ShieldCheckIcon, shortName: 'Security' },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, shortName: 'Analytics' },
  ],
};

export default function MobileNavigation({ userRole, isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = navigationItems[userRole] || [];
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef(null);
  const bottomNavRef = useRef(null);
  
  // Drag state for sidebar visual feedback
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle bottom navigation swipes
  const handleBottomNavSwipe = (deltaX) => {
    const bottomTabItems = navigation.slice(0, 4);
    const currentIndex = bottomTabItems.findIndex(item => isActive(item.href));
    
    if (currentIndex === -1) return;
    
    let newIndex;
    if (deltaX > 0 && currentIndex > 0) {
      // Swipe right - go to previous tab
      newIndex = currentIndex - 1;
    } else if (deltaX < 0 && currentIndex < bottomTabItems.length - 1) {
      // Swipe left - go to next tab
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== undefined && bottomTabItems[newIndex]) {
      router.push(bottomTabItems[newIndex].href);
    }
  };

  // Sidebar swipe gestures
  const sidebarSwipe = useSwipeGestures({
    onSwipeLeft: (deltaX) => {
      if (isOpen && deltaX < -50) {
        onClose();
      }
    },
    threshold: 30,
    preventDefaultTouchmoveEvent: true,
  });

  // Bottom navigation swipe gestures
  const bottomNavSwipe = useSwipeGestures({
    onSwipeLeft: handleBottomNavSwipe,
    onSwipeRight: handleBottomNavSwipe,
    threshold: 50,
  });

  // Handle sidebar drag visual feedback
  const handleSidebarTouchMove = (e) => {
    sidebarSwipe.handleTouchMove(e);
    
    if (isOpen && sidebarSwipe.isDragging) {
      const deltaX = e.touches[0].clientX - sidebarSwipe.touchStart.x;
      if (deltaX < 0) { // Only allow dragging left (closing)
        setDragOffset(Math.max(deltaX, -256)); // Max drag is sidebar width
      }
    }
  };

  const handleSidebarTouchEnd = () => {
    sidebarSwipe.handleTouchEnd();
    setDragOffset(0);
  };

  // Prevent body scroll when sidebar is open and being dragged
  useEffect(() => {
    if (isOpen && sidebarSwipe.isDragging) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, sidebarSwipe.isDragging]);

  const isActive = (href) => {
    if (href === '/customer/dashboard' && pathname === '/customer/dashboard') return true;
    if (href === '/employee/workspace' && pathname === '/employee/workspace') return true;
    if (href === '/admin/dashboard' && pathname === '/admin/dashboard') return true;
    return pathname.startsWith(href) && href !== '/customer/dashboard' && href !== '/employee/workspace' && href !== '/admin/dashboard';
  };

  // Get primary navigation items for bottom tabs (first 4-5 items)
  const bottomTabItems = navigation.slice(0, 4);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          transform: isOpen 
            ? `translateX(${dragOffset}px)` 
            : 'translateX(-100%)',
        }}
        onTouchStart={sidebarSwipe.handleTouchStart}
        onTouchMove={handleSidebarTouchMove}
        onTouchEnd={handleSidebarTouchEnd}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 safe-area-top">
            <h1 className="text-xl font-bold text-primary-600">SecureBank</h1>
            <div className="flex items-center gap-2">
              {/* Swipe indicator */}
              <div className="flex items-center text-xs text-gray-400">
                <span className="hidden sm:inline">Swipe left to close</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <button
                type="button"
                className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`
                        group flex items-center gap-x-3 rounded-lg p-3 text-sm font-medium transition-all duration-200 touch-target
                        ${active
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                  }
                      `}
                    >
                      <Icon
                        className={`h-6 w-6 shrink-0 transition-colors ${
                          active ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'
                        }`}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 safe-area-bottom">
            <p className="text-xs text-gray-500 text-center">
              SecureBank Mobile v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <div 
        ref={bottomNavRef}
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 lg:hidden safe-area-bottom"
        {...bottomNavSwipe.swipeHandlers}
      >
        <nav className="flex">
          {/* Swipe indicator for bottom navigation */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Swipe to navigate
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
          {bottomTabItems.map((item) => {
            const Icon = item.iconSolid || item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors touch-target
                  ${active
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-primary-600'
              }
                `}
              >
                <Icon className={`h-6 w-6 mb-1 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className="truncate">{item.shortName || item.name}</span>
                {active && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-600 rounded-b-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}