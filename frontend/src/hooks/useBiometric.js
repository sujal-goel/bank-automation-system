/**
 * Biometric Authentication Hook
 * Provides biometric authentication using WebAuthn API
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import useHapticFeedback from './useHapticFeedback';

export default function useBiometric() {
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState([]);
  
  const { triggerSuccessFeedback, triggerErrorFeedback } = useHapticFeedback();

  // Check biometric support
  useEffect(() => {
    const checkSupport = async () => {
      // Check WebAuthn support
      const webAuthnSupported = !!(
        window.PublicKeyCredential &&
        navigator.credentials &&
        navigator.credentials.create &&
        navigator.credentials.get
      );

      setIsSupported(webAuthnSupported);

      if (webAuthnSupported) {
        try {
          // Check if platform authenticator is available
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsAvailable(available);
        } catch (error) {
          console.warn('Could not check platform authenticator availability:', error);
          setIsAvailable(false);
        }
      }
    };

    checkSupport();
  }, []);

  // Register biometric credential
  const registerBiometric = useCallback(async (userId, userName, displayName) => {
    if (!isSupported || !isAvailable) {
      const error = new Error('Biometric authentication not supported or available');
      setError(error);
      triggerErrorFeedback();
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate challenge (in production, this should come from server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Banking App',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: displayName || userName,
        },
        pubKeyCredParams: [
          {
            alg: -7, // ES256
            type: 'public-key',
          },
          {
            alg: -257, // RS256
            type: 'public-key',
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: true,
        },
        timeout: 60000,
        attestation: 'direct',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        // Store credential info locally (in production, send to server)
        const credentialInfo = {
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          type: credential.type,
          userId,
          userName,
          displayName,
          createdAt: Date.now(),
        };

        const existingCredentials = JSON.parse(
          localStorage.getItem('biometric-credentials') || '[]',
        );
        
        const updatedCredentials = [
          ...existingCredentials.filter(cred => cred.userId !== userId),
          credentialInfo,
        ];
        
        localStorage.setItem('biometric-credentials', JSON.stringify(updatedCredentials));
        setCredentials(updatedCredentials);

        setLoading(false);
        triggerSuccessFeedback();
        
        return {
          success: true,
          credentialId: credential.id,
          credential: credentialInfo,
        };
      }
    } catch (error) {
      console.error('Biometric registration failed:', error);
      setError(error);
      setLoading(false);
      triggerErrorFeedback();
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric registration was cancelled or not allowed');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('A credential with this ID already exists');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Biometric authentication is not supported');
      } else {
        throw new Error('Biometric registration failed: ' + error.message);
      }
    }
  }, [isSupported, isAvailable, triggerSuccessFeedback, triggerErrorFeedback]);

  // Authenticate with biometric
  const authenticateBiometric = useCallback(async (userId) => {
    if (!isSupported || !isAvailable) {
      const error = new Error('Biometric authentication not supported or available');
      setError(error);
      triggerErrorFeedback();
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      // Get stored credentials
      const storedCredentials = JSON.parse(
        localStorage.getItem('biometric-credentials') || '[]',
      );

      const userCredential = storedCredentials.find(cred => cred.userId === userId);
      
      if (!userCredential) {
        throw new Error('No biometric credential found for this user');
      }

      // Generate challenge (in production, this should come from server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: new Uint8Array(userCredential.rawId),
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (assertion) {
        setLoading(false);
        triggerSuccessFeedback();
        
        return {
          success: true,
          credentialId: assertion.id,
          userId,
          authenticatedAt: Date.now(),
        };
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      setError(error);
      setLoading(false);
      triggerErrorFeedback();
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric authentication was cancelled or failed');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Invalid credential state');
      } else {
        throw new Error('Biometric authentication failed: ' + error.message);
      }
    }
  }, [isSupported, isAvailable, triggerSuccessFeedback, triggerErrorFeedback]);

  // Get stored credentials
  const getStoredCredentials = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('biometric-credentials') || '[]');
      setCredentials(stored);
      return stored;
    } catch (error) {
      console.error('Failed to get stored credentials:', error);
      return [];
    }
  }, []);

  // Remove credential
  const removeCredential = useCallback((userId) => {
    try {
      const existingCredentials = JSON.parse(
        localStorage.getItem('biometric-credentials') || '[]',
      );
      
      const updatedCredentials = existingCredentials.filter(
        cred => cred.userId !== userId,
      );
      
      localStorage.setItem('biometric-credentials', JSON.stringify(updatedCredentials));
      setCredentials(updatedCredentials);
      
      return true;
    } catch (error) {
      console.error('Failed to remove credential:', error);
      return false;
    }
  }, []);

  // Check if user has biometric credential
  const hasCredential = useCallback((userId) => {
    const storedCredentials = JSON.parse(
      localStorage.getItem('biometric-credentials') || '[]',
    );
    return storedCredentials.some(cred => cred.userId === userId);
  }, []);

  // Get biometric capability info
  const getBiometricInfo = useCallback(async () => {
    if (!isSupported) {
      return {
        supported: false,
        available: false,
        types: [],
      };
    }

    try {
      const info = {
        supported: isSupported,
        available: isAvailable,
        types: [],
      };

      // Try to determine available biometric types
      if (isAvailable) {
        // This is a rough detection - actual capabilities depend on device
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
          info.types = ['face-id', 'touch-id'];
        } else if (userAgent.includes('android')) {
          info.types = ['fingerprint', 'face-unlock'];
        } else if (userAgent.includes('windows')) {
          info.types = ['windows-hello'];
        } else {
          info.types = ['platform-authenticator'];
        }
      }

      return info;
    } catch (error) {
      console.error('Failed to get biometric info:', error);
      return {
        supported: isSupported,
        available: false,
        types: [],
      };
    }
  }, [isSupported, isAvailable]);

  // Load credentials on mount
  useEffect(() => {
    getStoredCredentials();
  }, [getStoredCredentials]);

  return {
    // State
    isSupported,
    isAvailable,
    error,
    loading,
    credentials,
    
    // Actions
    registerBiometric,
    authenticateBiometric,
    removeCredential,
    
    // Utilities
    getStoredCredentials,
    hasCredential,
    getBiometricInfo,
    
    // Helpers
    canRegister: isSupported && isAvailable && !loading,
    canAuthenticate: isSupported && isAvailable && !loading,
    hasAnyCredentials: credentials.length > 0,
  };
}