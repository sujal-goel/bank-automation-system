/**
 * Geolocation Hook
 * Provides location services for branch finder and location-based features
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useHapticFeedback from './useHapticFeedback';

export default function useGeolocation(options = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('prompt');
  
  const watchIdRef = useRef(null);
  const { triggerSuccessFeedback, triggerErrorFeedback } = useHapticFeedback();

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
    ...options,
  };

  // Check geolocation support
  useEffect(() => {
    const supported = 'geolocation' in navigator;
    setIsSupported(supported);

    // Check permission status if supported
    if (supported && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setPermission(result.state);
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermission(result.state);
          });
        })
        .catch(error => {
          console.warn('Could not query geolocation permission:', error);
        });
    }
  }, []);

  // Get current position
  const getCurrentPosition = useCallback(async (customOptions = {}) => {
    if (!isSupported) {
      const error = new Error('Geolocation is not supported');
      setError(error);
      triggerErrorFeedback();
      throw error;
    }

    setLoading(true);
    setError(null);

    const options = { ...defaultOptions, ...customOptions };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          
          setLocation(locationData);
          setLoading(false);
          triggerSuccessFeedback();
          resolve(locationData);
        },
        (error) => {
          setError(error);
          setLoading(false);
          triggerErrorFeedback();
          reject(error);
        },
        options,
      );
    });
  }, [isSupported, defaultOptions, triggerSuccessFeedback, triggerErrorFeedback]);

  // Start watching position
  const startWatching = useCallback((customOptions = {}) => {
    if (!isSupported) {
      const error = new Error('Geolocation is not supported');
      setError(error);
      return null;
    }

    // Clear existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setError(null);
    const options = { ...defaultOptions, ...customOptions };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };
        
        setLocation(locationData);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
        triggerErrorFeedback();
      },
      options,
    );

    setLoading(true);
    return watchIdRef.current;
  }, [isSupported, defaultOptions, triggerErrorFeedback]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setLoading(false);
    }
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }, []);

  // Find nearest locations from a list
  const findNearestLocations = useCallback((locations, maxResults = 5) => {
    if (!location || !locations.length) {
      return [];
    }

    const locationsWithDistance = locations.map(loc => ({
      ...loc,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        loc.latitude,
        loc.longitude,
      ),
    }));

    return locationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);
  }, [location, calculateDistance]);

  // Get address from coordinates (reverse geocoding)
  const getAddressFromCoordinates = useCallback(async (lat, lon) => {
    try {
      // Using a free geocoding service (you might want to use a paid service for production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      return {
        formatted: data.display_name || `${lat}, ${lon}`,
        street: data.locality || '',
        city: data.city || data.principalSubdivision || '',
        state: data.principalSubdivision || '',
        country: data.countryName || '',
        postalCode: data.postcode || '',
        raw: data,
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        formatted: `${lat}, ${lon}`,
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        raw: null,
      };
    }
  }, []);

  // Request permission explicitly
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Geolocation is not supported');
    }

    try {
      // Try to get position to trigger permission prompt
      await getCurrentPosition({ timeout: 5000 });
      return 'granted';
    } catch (error) {
      if (error.code === error.PERMISSION_DENIED) {
        setPermission('denied');
        return 'denied';
      }
      throw error;
    }
  }, [isSupported, getCurrentPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  // Format coordinates for display
  const formatCoordinates = useCallback((lat, lon, precision = 6) => {
    return {
      latitude: parseFloat(lat.toFixed(precision)),
      longitude: parseFloat(lon.toFixed(precision)),
      formatted: `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`,
      dms: {
        latitude: convertToDMS(lat, 'lat'),
        longitude: convertToDMS(lon, 'lon'),
      },
    };
  }, []);

  // Convert decimal degrees to degrees, minutes, seconds
  const convertToDMS = (decimal, type) => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(2);
    
    const direction = type === 'lat' 
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'W');
    
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  return {
    // State
    location,
    error,
    loading,
    isSupported,
    permission,
    isWatching: watchIdRef.current !== null,
    
    // Actions
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestPermission,
    
    // Utilities
    calculateDistance,
    findNearestLocations,
    getAddressFromCoordinates,
    formatCoordinates,
    
    // Helpers
    hasLocation: !!location,
    hasPermission: permission === 'granted',
    permissionDenied: permission === 'denied',
    
    // Error types for better handling
    isPermissionError: error?.code === 1, // PERMISSION_DENIED
    isPositionUnavailable: error?.code === 2, // POSITION_UNAVAILABLE
    isTimeout: error?.code === 3, // TIMEOUT
  };
}