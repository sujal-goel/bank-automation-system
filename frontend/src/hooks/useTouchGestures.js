/**
 * Comprehensive Touch Gestures Hook
 * Handles multiple touch gestures with haptic feedback
 */

'use client';

import { useRef, useCallback, useState } from 'react';
import useHapticFeedback from './useHapticFeedback';

export default function useTouchGestures({
  onTap,
  onDoubleTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchStart,
  onPinchMove,
  onPinchEnd,
  onRotateStart,
  onRotateMove,
  onRotateEnd,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
  hapticFeedback = true,
  preventScroll = false,
}) {
  const { 
    triggerTapFeedback, 
    triggerLongPressFeedback, 
    triggerSwipeFeedback, 
  } = useHapticFeedback();

  // Touch state
  const touchState = useRef({
    startTime: 0,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    lastTapTime: 0,
    tapCount: 0,
    isLongPress: false,
    longPressTimer: null,
    touches: [],
    initialDistance: 0,
    initialAngle: 0,
  });

  const [isGestureActive, setIsGestureActive] = useState(false);

  // Helper functions
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const clearLongPressTimer = () => {
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }
  };

  // Touch event handlers
  const handleTouchStart = useCallback((event) => {
    if (preventScroll) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const now = Date.now();
    
    touchState.current = {
      ...touchState.current,
      startTime: now,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isLongPress: false,
      touches: Array.from(event.touches),
    };

    setIsGestureActive(true);

    // Handle multi-touch gestures
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      touchState.current.initialDistance = getDistance(touch1, touch2);
      touchState.current.initialAngle = getAngle(touch1, touch2);
      
      onPinchStart?.({
        distance: touchState.current.initialDistance,
        angle: touchState.current.initialAngle,
        center: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        },
      });
      
      onRotateStart?.({
        angle: touchState.current.initialAngle,
        center: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        },
      });
      
      return;
    }

    // Set up long press timer for single touch
    if (onLongPress) {
      touchState.current.longPressTimer = setTimeout(() => {
        touchState.current.isLongPress = true;
        if (hapticFeedback) {
          triggerLongPressFeedback();
        }
        onLongPress({
          x: touchState.current.startX,
          y: touchState.current.startY,
        });
      }, longPressDelay);
    }
  }, [
    onLongPress, 
    onPinchStart, 
    onRotateStart, 
    longPressDelay, 
    hapticFeedback, 
    triggerLongPressFeedback,
    preventScroll,
  ]);

  const handleTouchMove = useCallback((event) => {
    if (preventScroll) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    touchState.current.currentX = touch.clientX;
    touchState.current.currentY = touch.clientY;

    // Handle multi-touch gestures
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const currentDistance = getDistance(touch1, touch2);
      const currentAngle = getAngle(touch1, touch2);
      
      const scale = currentDistance / touchState.current.initialDistance;
      const rotation = currentAngle - touchState.current.initialAngle;
      
      onPinchMove?.({
        scale,
        distance: currentDistance,
        center: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        },
      });
      
      onRotateMove?.({
        rotation,
        angle: currentAngle,
        center: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        },
      });
      
      return;
    }

    // Cancel long press if finger moves too much
    const deltaX = Math.abs(touch.clientX - touchState.current.startX);
    const deltaY = Math.abs(touch.clientY - touchState.current.startY);
    
    if ((deltaX > 10 || deltaY > 10) && !touchState.current.isLongPress) {
      clearLongPressTimer();
    }
  }, [onPinchMove, onRotateMove, preventScroll]);

  const handleTouchEnd = useCallback((event) => {
    clearLongPressTimer();
    setIsGestureActive(false);

    // Handle multi-touch gesture end
    if (touchState.current.touches.length === 2) {
      onPinchEnd?.();
      onRotateEnd?.();
      return;
    }

    // Skip gesture detection if it was a long press
    if (touchState.current.isLongPress) {
      return;
    }

    const deltaX = touchState.current.currentX - touchState.current.startX;
    const deltaY = touchState.current.currentY - touchState.current.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const duration = Date.now() - touchState.current.startTime;

    // Check for swipe gestures
    if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
      if (hapticFeedback) {
        triggerSwipeFeedback();
      }

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.({ deltaX, deltaY, duration });
        } else {
          onSwipeLeft?.({ deltaX, deltaY, duration });
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.({ deltaX, deltaY, duration });
        } else {
          onSwipeUp?.({ deltaX, deltaY, duration });
        }
      }
      return;
    }

    // Check for tap gestures
    if (absDeltaX < 10 && absDeltaY < 10 && duration < 500) {
      const now = Date.now();
      const timeSinceLastTap = now - touchState.current.lastTapTime;

      if (timeSinceLastTap < doubleTapDelay && touchState.current.tapCount === 1) {
        // Double tap
        touchState.current.tapCount = 0;
        onDoubleTap?.({
          x: touchState.current.startX,
          y: touchState.current.startY,
        });
      } else {
        // Single tap (with delay to check for double tap)
        touchState.current.tapCount = 1;
        touchState.current.lastTapTime = now;

        setTimeout(() => {
          if (touchState.current.tapCount === 1) {
            touchState.current.tapCount = 0;
            if (hapticFeedback) {
              triggerTapFeedback();
            }
            onTap?.({
              x: touchState.current.startX,
              y: touchState.current.startY,
            });
          }
        }, doubleTapDelay);
      }
    }
  }, [
    onTap,
    onDoubleTap,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinchEnd,
    onRotateEnd,
    swipeThreshold,
    doubleTapDelay,
    hapticFeedback,
    triggerTapFeedback,
    triggerSwipeFeedback,
  ]);

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    setIsGestureActive(false);
  }, []);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    isGestureActive,
  };
}