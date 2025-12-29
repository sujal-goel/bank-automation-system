/**
 * Biometric Authentication Component
 * Provides biometric login and registration interface
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import useBiometric from '@/hooks/useBiometric';
import ResponsiveButton from '@/components/ui/ResponsiveButton';

export default function BiometricAuth({
  userId,
  userName,
  displayName,
  onSuccess,
  onError,
  mode = 'authenticate', // 'authenticate' or 'register'
  className,
}) {
  const [biometricInfo, setBiometricInfo] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  
  const {
    isSupported,
    isAvailable,
    error,
    loading,
    credentials,
    registerBiometric,
    authenticateBiometric,
    removeCredential,
    hasCredential,
    getBiometricInfo,
    canRegister,
    canAuthenticate,
  } = useBiometric();

  // Get biometric info on mount
  useEffect(() => {
    const loadBiometricInfo = async () => {
      try {
        const info = await getBiometricInfo();
        setBiometricInfo(info);
      } catch (error) {
        console.error('Failed to get biometric info:', error);
      }
    };

    loadBiometricInfo();
  }, [getBiometricInfo]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleRegister = async () => {
    if (!userId || !userName) {
      onError?.(new Error('User ID and name are required for registration'));
      return;
    }

    try {
      const result = await registerBiometric(userId, userName, displayName);
      onSuccess?.(result);
      setShowSetup(false);
    } catch (error) {
      console.error('Biometric registration failed:', error);
      onError?.(error);
    }
  };

  const handleAuthenticate = async () => {
    if (!userId) {
      onError?.(new Error('User ID is required for authentication'));
      return;
    }

    try {
      const result = await authenticateBiometric(userId);
      onSuccess?.(result);
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      onError?.(error);
    }
  };

  const handleRemove = async () => {
    if (!userId) return;

    try {
      const success = removeCredential(userId);
      if (success) {
        onSuccess?.({ removed: true, userId });
      }
    } catch (error) {
      console.error('Failed to remove biometric credential:', error);
      onError?.(error);
    }
  };

  const getBiometricIcon = () => {
    if (!biometricInfo?.types.length) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }

    const primaryType = biometricInfo.types[0];
    
    if (primaryType.includes('face')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    
    if (primaryType.includes('fingerprint') || primaryType.includes('touch')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  };

  const getBiometricTypeLabel = () => {
    if (!biometricInfo?.types.length) return 'Biometric';
    
    const primaryType = biometricInfo.types[0];
    
    if (primaryType.includes('face')) return 'Face ID';
    if (primaryType.includes('fingerprint')) return 'Fingerprint';
    if (primaryType.includes('touch')) return 'Touch ID';
    if (primaryType.includes('windows')) return 'Windows Hello';
    
    return 'Biometric';
  };

  // Not supported
  if (!isSupported) {
    return (
      <div className={cn('text-center p-6 bg-gray-50 rounded-lg', className)}>
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Biometric Authentication Not Supported
        </h3>
        <p className="text-gray-600">
          Your device or browser doesn't support biometric authentication.
        </p>
      </div>
    );
  }

  // Not available
  if (!isAvailable) {
    return (
      <div className={cn('text-center p-6 bg-yellow-50 rounded-lg', className)}>
        <div className="text-yellow-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Biometric Authentication Not Available
        </h3>
        <p className="text-gray-600">
          No biometric authenticators are available on this device.
        </p>
      </div>
    );
  }

  const userHasCredential = userId && hasCredential(userId);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Authentication Mode */}
      {mode === 'authenticate' && (
        <div className="text-center">
          {userHasCredential ? (
            <div className="space-y-4">
              <div className="text-primary-600 mb-4">
                {getBiometricIcon()}
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Sign in with {getBiometricTypeLabel()}
              </h3>
              <p className="text-gray-600 mb-6">
                Use your {getBiometricTypeLabel().toLowerCase()} to securely sign in to your account.
              </p>
              
              <ResponsiveButton
                variant="primary"
                onClick={handleAuthenticate}
                loading={loading}
                disabled={!canAuthenticate}
                fullWidth
              >
                {loading ? 'Authenticating...' : `Use ${getBiometricTypeLabel()}`}
              </ResponsiveButton>
              
              <ResponsiveButton
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700"
              >
                Remove {getBiometricTypeLabel()}
              </ResponsiveButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-gray-400 mb-4">
                {getBiometricIcon()}
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {getBiometricTypeLabel()} Not Set Up
              </h3>
              <p className="text-gray-600 mb-6">
                Set up {getBiometricTypeLabel().toLowerCase()} for faster and more secure sign-ins.
              </p>
              
              <ResponsiveButton
                variant="outline"
                onClick={() => setShowSetup(true)}
                fullWidth
              >
                Set Up {getBiometricTypeLabel()}
              </ResponsiveButton>
            </div>
          )}
        </div>
      )}

      {/* Registration Mode */}
      {mode === 'register' && (
        <div className="text-center">
          <div className="text-primary-600 mb-4">
            {getBiometricIcon()}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Set Up {getBiometricTypeLabel()}
          </h3>
          <p className="text-gray-600 mb-6">
            Enable {getBiometricTypeLabel().toLowerCase()} for secure and convenient access to your account.
          </p>
          
          <div className="space-y-3">
            <ResponsiveButton
              variant="primary"
              onClick={handleRegister}
              loading={loading}
              disabled={!canRegister}
              fullWidth
            >
              {loading ? 'Setting Up...' : `Enable ${getBiometricTypeLabel()}`}
            </ResponsiveButton>
            
            <ResponsiveButton
              variant="ghost"
              onClick={() => onSuccess?.({ skipped: true })}
              fullWidth
            >
              Skip for Now
            </ResponsiveButton>
          </div>
        </div>
      )}

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="text-primary-600 mb-4">
                {getBiometricIcon()}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Set Up {getBiometricTypeLabel()}
              </h3>
              <p className="text-gray-600 mb-6">
                This will enable {getBiometricTypeLabel().toLowerCase()} authentication for your account.
              </p>
              
              <div className="space-y-3">
                <ResponsiveButton
                  variant="primary"
                  onClick={handleRegister}
                  loading={loading}
                  disabled={!canRegister}
                  fullWidth
                >
                  {loading ? 'Setting Up...' : 'Continue'}
                </ResponsiveButton>
                
                <ResponsiveButton
                  variant="outline"
                  onClick={() => setShowSetup(false)}
                  fullWidth
                >
                  Cancel
                </ResponsiveButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-900">Authentication Error</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Display */}
      {biometricInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Available Methods</p>
              <p className="text-sm text-blue-700">
                {biometricInfo.types.length > 0 
                  ? biometricInfo.types.join(', ')
                  : 'Platform authenticator'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}