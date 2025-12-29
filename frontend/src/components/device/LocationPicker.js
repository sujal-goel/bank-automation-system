/**
 * Location Picker Component
 * Provides location selection and branch finder functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import useGeolocation from '@/hooks/useGeolocation';
import ResponsiveButton from '@/components/ui/ResponsiveButton';
import { TouchInput } from '@/components/ui/TouchForm';

// Sample branch data (in production, this would come from an API)
const SAMPLE_BRANCHES = [
  {
    id: 1,
    name: 'Downtown Branch',
    address: '123 Main St, Downtown',
    latitude: 40.7128,
    longitude: -74.0060,
    phone: '(555) 123-4567',
    hours: 'Mon-Fri 9AM-5PM',
    services: ['ATM', 'Teller', 'Loan Officer'],
  },
  {
    id: 2,
    name: 'Uptown Branch',
    address: '456 Broadway Ave, Uptown',
    latitude: 40.7589,
    longitude: -73.9851,
    phone: '(555) 234-5678',
    hours: 'Mon-Fri 9AM-6PM, Sat 9AM-2PM',
    services: ['ATM', 'Teller', 'Financial Advisor'],
  },
  {
    id: 3,
    name: 'Westside Branch',
    address: '789 Park Blvd, Westside',
    latitude: 40.7282,
    longitude: -74.0776,
    phone: '(555) 345-6789',
    hours: 'Mon-Fri 8AM-6PM, Sat 9AM-3PM',
    services: ['ATM', 'Teller', 'Business Banking'],
  },
];

export default function LocationPicker({
  onLocationSelect,
  onBranchSelect,
  className,
  showBranchFinder = true,
  maxResults = 5,
}) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [nearbyBranches, setNearbyBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  
  const {
    location,
    error,
    loading,
    isSupported,
    permission,
    hasPermission,
    permissionDenied,
    getCurrentPosition,
    findNearestLocations,
    getAddressFromCoordinates,
    requestPermission,
    formatCoordinates,
  } = useGeolocation();

  // Update nearby branches when location changes
  useEffect(() => {
    if (location && showBranchFinder) {
      const nearest = findNearestLocations(SAMPLE_BRANCHES, maxResults);
      setNearbyBranches(nearest);
    }
  }, [location, showBranchFinder, maxResults, findNearestLocations]);

  // Handle location selection
  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
    onLocationSelect?.(locationData);
  };

  // Handle branch selection
  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    onBranchSelect?.(branch);
    
    // Also set location to branch location
    const branchLocation = {
      latitude: branch.latitude,
      longitude: branch.longitude,
      accuracy: 0,
      timestamp: Date.now(),
      source: 'branch-selection',
    };
    handleLocationSelect(branchLocation);
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    if (!hasPermission && !permissionDenied) {
      setShowPermissionPrompt(true);
      return;
    }

    try {
      const position = await getCurrentPosition();
      handleLocationSelect(position);
      
      // Get address for display
      const address = await getAddressFromCoordinates(
        position.latitude,
        position.longitude,
      );
      
      setSelectedLocation({
        ...position,
        address,
      });
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  // Request location permission
  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission();
      setShowPermissionPrompt(false);
      
      if (result === 'granted') {
        handleGetCurrentLocation();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setShowPermissionPrompt(false);
    }
  };

  // Search branches
  const filteredBranches = SAMPLE_BRANCHES.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayBranches = searchQuery ? filteredBranches : nearbyBranches;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Location Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Your Location</h3>
        
        {selectedLocation ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Location Selected
                </p>
                {selectedLocation.address ? (
                  <p className="text-sm text-green-700">
                    {selectedLocation.address.formatted}
                  </p>
                ) : (
                  <p className="text-sm text-green-700">
                    {formatCoordinates(
                      selectedLocation.latitude,
                      selectedLocation.longitude,
                    ).formatted}
                  </p>
                )}
                {selectedLocation.accuracy && (
                  <p className="text-xs text-green-600">
                    Accuracy: ±{Math.round(selectedLocation.accuracy)}m
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {!isSupported ? (
              <div>
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <p className="text-gray-600 mb-4">Location services not supported</p>
              </div>
            ) : permissionDenied ? (
              <div>
                <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                </svg>
                <p className="text-gray-600 mb-4">Location access denied</p>
                <p className="text-sm text-gray-500 mb-4">
                  Please enable location access in your browser settings to find nearby branches.
                </p>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600 mb-4">Get your current location</p>
                <ResponsiveButton
                  onClick={handleGetCurrentLocation}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Getting Location...' : 'Use Current Location'}
                </ResponsiveButton>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-900">Location Error</p>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Branch Finder Section */}
      {showBranchFinder && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Find a Branch</h3>
          
          {/* Search */}
          <TouchInput
            placeholder="Search branches by name or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon="🔍"
          />
          
          {/* Branch List */}
          <div className="space-y-3">
            {displayBranches.length > 0 ? (
              displayBranches.map((branch) => (
                <div
                  key={branch.id}
                  className={cn(
                    'border rounded-lg p-4 cursor-pointer transition-all duration-200',
                    selectedBranch?.id === branch.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                  )}
                  onClick={() => handleBranchSelect(branch)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{branch.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{branch.address}</p>
                      <p className="text-sm text-gray-500 mt-1">{branch.hours}</p>
                      
                      {/* Services */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {branch.services.map((service) => (
                          <span
                            key={service}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-4 text-right">
                      {branch.distance && (
                        <p className="text-sm font-medium text-primary-600">
                          {branch.distance.toFixed(1)} km
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{branch.phone}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-600">
                  {searchQuery ? 'No branches found matching your search' : 'No nearby branches found'}
                </p>
                {!location && (
                  <p className="text-sm text-gray-500 mt-2">
                    Enable location access to find nearby branches
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permission Prompt Modal */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Location Access
              </h3>
              <p className="text-gray-600 mb-6">
                We need access to your location to find nearby branches and provide better service.
              </p>
              <div className="space-y-3">
                <ResponsiveButton
                  variant="primary"
                  fullWidth
                  onClick={handleRequestPermission}
                >
                  Allow Location Access
                </ResponsiveButton>
                <ResponsiveButton
                  variant="outline"
                  fullWidth
                  onClick={() => setShowPermissionPrompt(false)}
                >
                  Not Now
                </ResponsiveButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}