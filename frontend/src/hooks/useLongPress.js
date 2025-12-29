/**
 * Long Press Hook
 * Handles long press gestures with haptic feedback
 */

'use client';

import { useRef, useCallback } from 'react';
import useHapticFeedback from './useHapticFeedback';

export default function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
  hapticFeedback = true,
}) {
  const { triggerLongPressFeedback, triggerTapFeedback } = useHapticFeedback();
  const isLongPress = useRef(false);
  const timeoutRef = useRef(null);

  const start = useCallback((event) => {
    if (event.type === 'click' && event.detail > 1) {
      return; // Ignore multiple clicks
    }

    isLongPress.current = false;
    
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (hapticFeedback) {
        triggerLongPressFeedback();
      }
      onLongPress?.(event);
    }, threshold);
  }, [onLongPress, threshold, hapticFeedback, triggerLongPressFeedback]);

  const clear = useCallback((event, shouldTriggerClick = true) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (shouldTriggerClick && !isLongPress.current) {
      if (hapticFeedback) {
        triggerTapFeedback();
      }
      onClick?.(event);
    }
  }, [onClick, hapticFeedback, triggerTapFeedback]);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: (event) => clear(event, false),
    onTouchEnd: clear,
    onTouchCancel: (event) => clear(event, false),
  };
}