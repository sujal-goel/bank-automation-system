/**
 * Touch-Friendly Navigation Component
 * Enhanced navigation with proper touch targets and gesture support
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import useTouchGestures from '@/hooks/useTouchGestures';
import useHapticFeedback from '@/hooks/useHapticFeedback';
import ResponsiveButton from './ResponsiveButton';

export default function TouchFriendlyNavigation({ 
  routes = [], 
  children, 
  enableSwipeNavigation = true,
  showIndicators = true,
  hapticFeedback = true,
  className, 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const { triggerSwipeFeedback, triggerTapFeedback } = useHapticFeedback();

  // Find current route index
  useEffect(() => {
    const index = routes.findIndex(route => pathname.startsWith(route.path));
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [pathname, routes]);

  const navigateToRoute = async (index) => {
    if (index >= 0 && index < routes.length && index !== currentIndex) {
      setIsNavigating(true);
      const route = routes[index];
      
      try {
        await router.push(route.path);
        setCurrentIndex(index);
        
        if (hapticFeedback) {
          triggerTapFeedback();
        }
      } catch (error) {
        console.error('Navigation failed:', error);
      } finally {
        setIsNavigating(false);
      }
    }
  };

  const handleSwipeLeft = () => {
    if (!enableSwipeNavigation || isNavigating) return;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < routes.length) {
      if (hapticFeedback) {
        triggerSwipeFeedback();
      }
      navigateToRoute(nextIndex);
    }
  };

  const handleSwipeRight = () => {
    if (!enableSwipeNavigation || isNavigating) return;
    
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      if (hapticFeedback) {
        triggerSwipeFeedback();
      }
      navigateToRoute(prevIndex);
    }
  };

  const { touchHandlers } = useTouchGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    swipeThreshold: 100, // Higher threshold for navigation
    hapticFeedback,
  });

  return (
    <div className={cn('h-full w-full relative', className)}>
      {/* Main content area with swipe detection */}
      <div 
        className="h-full w-full"
        {...(enableSwipeNavigation ? touchHandlers : {})}
      >
        {children}
      </div>
      
      {/* Navigation indicators */}
      {showIndicators && routes.length > 1 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20 lg:hidden">
          <div className="flex space-x-2 bg-black bg-opacity-50 rounded-full px-4 py-3 backdrop-blur-sm">
            {routes.map((route, index) => (
              <ResponsiveButton
                key={index}
                size="icon"
                variant="ghost"
                onClick={() => navigateToRoute(index)}
                disabled={isNavigating}
                hapticFeedback={hapticFeedback}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-200 p-0 min-w-[44px] min-h-[44px]',
                  'flex items-center justify-center',
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75',
                )}
                aria-label={`Navigate to ${route.label || route.path}`}
              >
                <span className="sr-only">
                  {route.label || `Page ${index + 1}`}
                </span>
              </ResponsiveButton>
            ))}
          </div>
        </div>
      )}
      
      {/* Navigation progress indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-primary-200">
            <div className="h-full bg-primary-600 animate-pulse" />
          </div>
        </div>
      )}
      
      {/* Swipe hints for first-time users */}
      {enableSwipeNavigation && routes.length > 1 && (
        <>
          {/* Left swipe hint */}
          {currentIndex > 0 && (
            <div className="fixed left-2 top-1/2 transform -translate-y-1/2 z-10 lg:hidden">
              <div className="bg-black bg-opacity-30 rounded-full p-2 animate-pulse">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </div>
            </div>
          )}
          
          {/* Right swipe hint */}
          {currentIndex < routes.length - 1 && (
            <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-10 lg:hidden">
              <div className="bg-black bg-opacity-30 rounded-full p-2 animate-pulse">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Bottom tab navigation component
export function TouchBottomTabs({ 
  tabs = [], 
  activeTab, 
  onTabChange, 
  hapticFeedback = true,
  className, 
}) {
  const { triggerTapFeedback } = useHapticFeedback();

  const handleTabChange = (tabId) => {
    if (hapticFeedback) {
      triggerTapFeedback();
    }
    onTabChange?.(tabId);
  };

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-30 lg:hidden',
      'bg-white border-t border-gray-200 safe-area-bottom',
      className,
    )}>
      <div className="flex">
        {tabs.map((tab) => (
          <ResponsiveButton
            key={tab.id}
            variant="ghost"
            size="default"
            onClick={() => handleTabChange(tab.id)}
            hapticFeedback={hapticFeedback}
            className={cn(
              'flex-1 flex flex-col items-center justify-center',
              'py-2 px-1 min-h-[60px] rounded-none',
              'text-xs font-medium transition-colors duration-200',
              activeTab === tab.id
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.icon && (
              <span className="text-xl mb-1">
                {tab.icon}
              </span>
            )}
            <span className="truncate max-w-full">
              {tab.label}
            </span>
          </ResponsiveButton>
        ))}
      </div>
    </div>
  );
}

// Floating action button component
export function TouchFAB({ 
  icon, 
  label, 
  onClick, 
  position = 'bottom-right',
  hapticFeedback = true,
  className, 
}) {
  const positionClasses = {
    'bottom-right': 'fixed bottom-20 right-4 lg:bottom-6 lg:right-6',
    'bottom-left': 'fixed bottom-20 left-4 lg:bottom-6 lg:left-6',
    'bottom-center': 'fixed bottom-20 left-1/2 transform -translate-x-1/2 lg:bottom-6',
  };

  return (
    <ResponsiveButton
      size="lg"
      variant="primary"
      onClick={onClick}
      hapticFeedback={hapticFeedback}
      className={cn(
        positionClasses[position],
        'z-40 shadow-lg hover:shadow-xl',
        'w-14 h-14 rounded-full p-0',
        'flex items-center justify-center',
        className,
      )}
      aria-label={label}
    >
      {icon && (
        <span className="text-xl">
          {icon}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </ResponsiveButton>
  );
}