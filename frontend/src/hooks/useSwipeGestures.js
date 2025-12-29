/**
 * Custom hook for handling swipe gestures
 * Provides reusable swipe detection functionality
 */

import { useState, useCallback } from 'react';

export const useSwipeGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventDefaultTouchmoveEvent = false,
  deltaThreshold = 5,
}) => {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  }, [isDragging, preventDefaultTouchmoveEvent]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Determine swipe direction based on the larger delta
    if (Math.max(absDeltaX, absDeltaY) > threshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > deltaThreshold && onSwipeRight) {
          onSwipeRight(deltaX);
        } else if (deltaX < -deltaThreshold && onSwipeLeft) {
          onSwipeLeft(deltaX);
        }
      } else {
        // Vertical swipe
        if (deltaY > deltaThreshold && onSwipeDown) {
          onSwipeDown(deltaY);
        } else if (deltaY < -deltaThreshold && onSwipeUp) {
          onSwipeUp(deltaY);
        }
      }
    }
    
    // Reset state
    setIsDragging(false);
    setTouchStart({ x: 0, y: 0 });
    setTouchEnd({ x: 0, y: 0 });
  }, [
    isDragging,
    touchStart,
    touchEnd,
    threshold,
    deltaThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  ]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging,
    touchStart,
    touchEnd,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

export default useSwipeGestures;