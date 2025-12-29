/**
 * Touch Swipe Gesture Hook
 * Handles swipe gestures for mobile navigation
 */

'use client';

import { useRef, useEffect } from 'react';

export default function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventScroll = false,
}) {
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const elementRef = useRef(null);

  const minSwipeDistance = threshold;

  const onTouchStart = (e) => {
    touchEndRef.current = null; // Reset end position
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };

    if (preventScroll) {
      e.preventDefault();
    }
  };

  const onTouchMove = (e) => {
    if (preventScroll) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e) => {
    if (!touchStartRef.current) return;

    touchEndRef.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: perforow(),
    };

    handleGesture();
  };

  const handleGesture = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const deltaX = touchStartRef.current.x - touchEndRef.current.x;
    const deltaY = touchStartRef.current.y - touchEndRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

    // Ignore very slow gestures (> 1 second)
    if (deltaTime > 1000) return;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if it's a horizontal or vertical swipe
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > minSwipeDistance) {
        if (deltaX > 0) {
          // Swipe left
          onSwipeLeft?.();
        } else {
          // Swipe right
          onSwipeRight?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > minSwipeDistance) {
        if (deltaY > 0) {
          // Swipe up
          onSwipeUp?.();
        } else {
          // Swipe down
          onSwipeDown?.();
        }
      }
    }
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add touch event listeners
    element.addEventListener('touchstart', onTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, preventScroll]);

  return elementRef;
}