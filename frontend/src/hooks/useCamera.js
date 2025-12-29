/**
 * Camera Integration Hook
 * Provides camera access for document capture and photo taking
 */

'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import useHapticFeedback from './useHapticFeedback';

export default function useCamera() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { triggerTapFeedback, triggerSuccessFeedback, triggerErrorFeedback } = useHapticFeedback();

  // Check camera support
  const isSupported = useMemo(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  const checkSupport = useCallback(() => {
    return isSupported;
  }, [isSupported]);

  // Start camera stream
  const startCamera = useCallback(async (constraints = {}) => {
    if (!checkSupport()) {
      const error = new Error('Camera not supported on this device');
      setError(error);
      triggerErrorFeedback();
      throw error;
    }

    try {
      setError(null);
      
      const defaultConstraints = {
        video: {
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          ...constraints.video,
        },
        audio: false,
        ...constraints,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setStream(mediaStream);
      setIsActive(true);
      triggerSuccessFeedback();
      
      return mediaStream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      setError(error);
      triggerErrorFeedback();
      throw error;
    }
  }, [checkSupport, triggerSuccessFeedback, triggerErrorFeedback]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setError(null);
  }, [stream]);

  // Capture photo from video stream
  const capturePhoto = useCallback((quality = 0.9) => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      const error = new Error('Camera not active or elements not ready');
      setError(error);
      triggerErrorFeedback();
      throw error;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            triggerTapFeedback();
            resolve({
              blob,
              url: imageUrl,
              width: canvas.width,
              height: canvas.height,
              timestamp: Date.now(),
            });
          } else {
            reject(new Error('Failed to capture image'));
          }
        }, 'image/jpeg', quality);
      });
    } catch (error) {
      console.error('Failed to capture photo:', error);
      setError(error);
      triggerErrorFeedback();
      throw error;
    }
  }, [isActive, triggerTapFeedback, triggerErrorFeedback]);

  // Switch between front and back camera
  const switchCamera = useCallback(async () => {
    if (!isActive || !stream) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const currentFacingMode = videoTrack.getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      stopCamera();
      await startCamera({
        video: { facingMode: newFacingMode },
      });
      
      triggerTapFeedback();
    } catch (error) {
      console.error('Failed to switch camera:', error);
      setError(error);
      triggerErrorFeedback();
    }
  }, [isActive, stream, stopCamera, startCamera, triggerTapFeedback, triggerErrorFeedback]);

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    if (!checkSupport()) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to get available cameras:', error);
      return [];
    }
  }, [checkSupport]);

  // Take photo with file input fallback
  const takePhotoWithFallback = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Create file input for fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Prefer camera

      input.onchange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setCapturedImage(url);
          triggerSuccessFeedback();
          resolve({
            blob: file,
            url,
            width: 0, // Unknown until loaded
            height: 0, // Unknown until loaded
            timestamp: Date.now(),
          });
        } else {
          reject(new Error('No file selected'));
        }
      };

      input.oncancel = () => {
        reject(new Error('User cancelled'));
      };

      input.click();
    });
  }, [triggerSuccessFeedback]);

  // Clear captured image
  const clearCapturedImage = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
  }, [capturedImage]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    stopCamera();
    clearCapturedImage();
  }, [stopCamera, clearCapturedImage]);

  return {
    // State
    isSupported,
    isActive,
    error,
    capturedImage,
    stream,
    
    // Refs for components
    videoRef,
    canvasRef,
    
    // Actions
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    takePhotoWithFallback,
    clearCapturedImage,
    cleanup,
    
    // Utilities
    getAvailableCameras,
    checkSupport,
  };
}