/**
 * Haptic Feedback Hook
 * Provides haptic feedback for mobile interactions
 */

'use client';

import { useCallback } from 'react';

export default function useHapticFeedback() {
  const isHapticSupported = useCallback(() => {
    return 'vibrate' in navigator || 'hapticFeedback' in navigator;
  }, []);

  const triggerHaptic = useCallback((type = 'light') => {
    // Check if running on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile || !isHapticSupported()) {
      return;
    }

    try {
      // iOS Haptic Feedback (if available)
      if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ haptic feedback
        if (navigator.hapticFeedback) {
          switch (type) {
            case 'light':
              navigator.hapticFeedback.impact('light');
              break;
            case 'medium':
              navigator.hapticFeedback.impact('medium');
              break;
            case 'heavy':
              navigator.hapticFeedback.impact('heavy');
              break;
            case 'success':
              navigator.hapticFeedback.notification('success');
              break;
            case 'warning':
              navigator.hapticFeedback.notification('warning');
              break;
            case 'error':
              navigator.hapticFeedback.notification('error');
              break;
            default:
              navigator.hapticFeedback.impact('light');
          }
          return;
        }
      }

      // Fallback to vibration API
      if (navigator.vibrate) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30],
          success: [10, 50, 10],
          warning: [20, 100, 20],
          error: [50, 100, 50],
          tap: [5],
          click: [10],
          longPress: [50],
          swipe: [15],
        };

        const pattern = patterns[type] || patterns.light;
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, [isHapticSupported]);

  const triggerTapFeedback = useCallback(() => {
    triggerHaptic('tap');
  }, [triggerHaptic]);

  const triggerClickFeedback = useCallback(() => {
    triggerHaptic('click');
  }, [triggerHaptic]);

  const triggerLongPressFeedback = useCallback(() => {
    triggerHaptic('longPress');
  }, [triggerHaptic]);

  const triggerSwipeFeedback = useCallback(() => {
    triggerHaptic('swipe');
  }, [triggerHaptic]);

  const triggerSuccessFeedback = useCallback(() => {
    triggerHaptic('success');
  }, [triggerHaptic]);

  const triggerErrorFeedback = useCallback(() => {
    triggerHaptic('error');
  }, [triggerHaptic]);

  const triggerWarningFeedback = useCallback(() => {
    triggerHaptic('warning');
  }, [triggerHaptic]);

  return {
    isHapticSupported,
    triggerHaptic,
    triggerTapFeedback,
    triggerClickFeedback,
    triggerLongPressFeedback,
    triggerSwipeFeedback,
    triggerSuccessFeedback,
    triggerErrorFeedback,
    triggerWarningFeedback,
  };
}