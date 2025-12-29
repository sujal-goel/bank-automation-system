/**
 * Camera Capture Component
 * Provides camera interface for document capture
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import useCamera from '@/hooks/useCamera';
import ResponsiveButton from '@/components/ui/ResponsiveButton';

export default function CameraCapture({
  onCapture,
  onError,
  className,
  quality = 0.9,
  facingMode = 'environment',
  showPreview = true,
  autoStart = false,
}) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const {
    isSupported,
    isActive,
    error,
    capturedImage,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    takePhotoWithFallback,
    clearCapturedImage,
    cleanup,
  } = useCamera();

  // Auto-start camera if requested
  useEffect(() => {
    if (autoStart && isSupported) {
      handleStartCamera();
    }

    return cleanup;
  }, [autoStart, isSupported, cleanup]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleStartCamera = async () => {
    try {
      await startCamera({
        video: { facingMode },
      });
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  };

  const handleCapture = async () => {
    try {
      const result = await capturePhoto(quality);
      setIsPreviewMode(true);
      onCapture?.(result);
    } catch (error) {
      console.error('Failed to capture photo:', error);
    }
  };

  const handleRetake = () => {
    clearCapturedImage();
    setIsPreviewMode(false);
  };

  const handleConfirm = () => {
    stopCamera();
    // Keep the captured image for parent component
  };

  const handleFallback = async () => {
    try {
      const result = await takePhotoWithFallback();
      onCapture?.(result);
    } catch (error) {
      console.error('Failed to take photo with fallback:', error);
    }
  };

  if (!isSupported) {
    return (
      <div className={cn('text-center p-6', className)}>
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Not Available</h3>
        <p className="text-gray-600 mb-4">
          Your device doesn't support camera access or camera permission was denied.
        </p>
        <ResponsiveButton onClick={handleFallback}>
          Choose from Gallery
        </ResponsiveButton>
      </div>
    );
  }

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden', className)}>
      {/* Camera View */}
      {!isPreviewMode && (
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Camera overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Viewfinder overlay */}
            <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
            </div>
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-black/50 rounded px-3 py-2">
                Position document within the frame
              </p>
            </div>
          </div>
          
          {/* Camera controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
            {!isActive && (
              <ResponsiveButton
                variant="primary"
                onClick={handleStartCamera}
                className="bg-white text-black hover:bg-gray-100"
              >
                Start Camera
              </ResponsiveButton>
            )}
            
            {isActive && (
              <>
                <ResponsiveButton
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="text-white hover:bg-white/20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </ResponsiveButton>
                
                <ResponsiveButton
                  size="icon"
                  onClick={handleCapture}
                  className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-100"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </ResponsiveButton>
                
                <ResponsiveButton
                  variant="ghost"
                  size="icon"
                  onClick={stopCamera}
                  className="text-white hover:bg-white/20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </ResponsiveButton>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Preview Mode */}
      {isPreviewMode && capturedImage && showPreview && (
        <div className="relative">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
          
          {/* Preview controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
            <ResponsiveButton
              variant="outline"
              onClick={handleRetake}
              className="bg-white/90 text-black hover:bg-white"
            >
              Retake
            </ResponsiveButton>
            
            <ResponsiveButton
              variant="primary"
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Use Photo
            </ResponsiveButton>
          </div>
        </div>
      )}
      
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center p-4">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-900 mb-2">Camera Error</h3>
            <p className="text-red-700 text-sm mb-4">{error.message}</p>
            <div className="space-x-2">
              <ResponsiveButton
                variant="outline"
                size="sm"
                onClick={handleStartCamera}
              >
                Try Again
              </ResponsiveButton>
              <ResponsiveButton
                variant="primary"
                size="sm"
                onClick={handleFallback}
              >
                Choose File
              </ResponsiveButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}