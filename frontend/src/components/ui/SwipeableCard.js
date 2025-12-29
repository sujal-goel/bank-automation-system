/**
 * Swipeable Card Component
 * Touch-friendly card with comprehensive gesture support and haptic feedback
 */

'use client';

import { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import useTouchGestures from '@/hooks/useTouchGestures';
import useHapticFeedback from '@/hooks/useHapticFeedback';
import MobileCard from './MobileCard';

const SwipeableCard = forwardRef(({ 
  children, 
  className,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  leftAction,
  rightAction,
  swipeThreshold = 50,
  hapticFeedback = true,
  ...props 
}, ref) => {
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const { triggerSwipeFeedback, triggerTapFeedback } = useHapticFeedback();

  const handleSwipeLeft = (gestureData) => {
    if (hapticFeedback) {
      triggerSwipeFeedback();
    }
    setIsSwipeActive(true);
    setSwipeDirection('left');
    onSwipeLeft?.(gestureData);
    setTimeout(() => {
      setIsSwipeActive(false);
      setSwipeDirection(null);
    }, 200);
  };

  const handleSwipeRight = (gestureData) => {
    if (hapticFeedback) {
      triggerSwipeFeedback();
    }
    setIsSwipeActive(true);
    setSwipeDirection('right');
    onSwipeRight?.(gestureData);
    setTimeout(() => {
      setIsSwipeActive(false);
      setSwipeDirection(null);
    }, 200);
  };

  const handleSwipeUp = (gestureData) => {
    if (hapticFeedback) {
      triggerSwipeFeedback();
    }
    onSwipeUp?.(gestureData);
  };

  const handleSwipeDown = (gestureData) => {
    if (hapticFeedback) {
      triggerSwipeFeedback();
    }
    onSwipeDown?.(gestureData);
  };

  const handleTap = (gestureData) => {
    if (hapticFeedback) {
      triggerTapFeedback();
    }
    onTap?.(gestureData);
  };

  const { touchHandlers, isGestureActive } = useTouchGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeUp: handleSwipeUp,
    onSwipeDown: handleSwipeDown,
    onTap: handleTap,
    onDoubleTap,
    onLongPress,
    swipeThreshold,
    hapticFeedback,
  });

  return (
    <div className="relative">
      {/* Background actions */}
      {(leftAction || rightAction) && (
        <div className="absolute inset-0 flex">
          {/* Left action */}
          {leftAction && (
            <div className="flex-1 flex items-center justify-start pl-4 bg-green-500 text-white rounded-l-lg">
              {leftAction}
            </div>
          )}
          
          {/* Right action */}
          {rightAction && (
            <div className="flex-1 flex items-center justify-end pr-4 bg-red-500 text-white rounded-r-lg">
              {rightAction}
            </div>
          )}
        </div>
      )}

      {/* Main card */}
      <MobileCard
        ref={ref}
        className={cn(
          'transition-transform duration-200 ease-out touch-target',
          (isSwipeActive || isGestureActive) && 'scale-[0.98]',
          swipeDirection === 'left' && 'translate-x-2',
          swipeDirection === 'right' && '-translate-x-2',
          className,
        )}
        {...touchHandlers}
        {...props}
      >
        {children}
      </MobileCard>
    </div>
  );
});

SwipeableCard.displayName = 'SwipeableCard';

export default SwipeableCard;