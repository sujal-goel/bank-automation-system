/**
 * Touch Navigation Component
 * Swipe-enabled navigation for mobile devices
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useSwipeGesture from '@/hooks/useSwipeGesture';
import useHapticFeedback from '@/hooks/useHapticFeedback';

export default function TouchNavigation({ 
  routes = [], 
  children, 
  enableSwipeNavigation = true,
  hapticFeedback = true, 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { triggerSwipeFeedback } = useHapticFeedback();

  // Find current route index
  useEffect(() => {
    const index = routes.findIndex(route => pathname.startsWith(route.path));
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [pathname, routes]);

  const navigateToRoute = (index) => {
    if (index >= 0 && index < routes.length) {
      const route = routes[index];
      router.push(route.path);
      setCurrentIndex(index);
    }
  };

  const handleSwipeLeft = () => {
    if (!enableSwipeNavigation) return;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < routes.length) {
      if (hapticFeedback) {
        triggerSwipeFeedback();
      }
      navigateToRoute(nextIndex);
    }
  };

  const handleSwipeRight = () => {
    if (!enableSwipeNavigation) return;
    
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      if (hapticFeedback) {
        triggerSwipeFeedback();
      }
      navigateToRoute(prevIndex);
    }
  };

  const swipeRef = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 100, // Higher threshold for navigation
  });

  return (
    <div ref={swipeRef} className="h-full w-full">
      {children}
      
      {/* Navigation indicators */}
      {enableSwipeNavigation && routes.length > 1 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20 lg:hidden">
          <div className="flex space-x-2 bg-black bg-opacity-50 rounded-full px-3 py-2">
            {routes.map((_, index) => (
              <button
                key={index}
                onClick={() => navigateToRoute(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 touch-target ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}