/**
 * Alerting System Demo Page
 * Demonstrates the complete alerting system functionality
 */
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AlertingSystem to avoid SSR issues with React Query
const AlertingSystem = dynamic(
  () => import('../../../../components/charts/AlertingSystem'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ),
  },
);

/**
 * Alerting System Page Component
 */
export default function AlertingPage() {
  const [mounted, setMounted] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Alert Management System
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Configure thresholds, monitor active alerts, and track delivery status across all channels.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alert Management System
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure thresholds, monitor active alerts, and track delivery status across all channels.
          </p>
        </div>

        {/* Alerting System Component */}
        <AlertingSystem className="mb-8" />

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Threshold Configuration
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Configure alert thresholds for system metrics</li>
              <li>• Set severity levels and cooldown periods</li>
              <li>• Choose delivery channels (email, SMS, in-app)</li>
              <li>• Manage recipient lists and notifications</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Alert Delivery System
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Multi-channel alert delivery (email, SMS, in-app)</li>
              <li>• Real-time delivery status tracking</li>
              <li>• Automatic retry for failed deliveries</li>
              <li>• Delivery acknowledgment tracking</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Alert History & Analytics
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Complete alert history with filtering</li>
              <li>• Resolution time tracking</li>
              <li>• Alert acknowledgment audit trail</li>
              <li>• Performance metrics and statistics</li>
            </ul>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
            Implementation Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-medium mb-2">Threshold Management:</h4>
              <ul className="space-y-1">
                <li>• Create, edit, and delete alert thresholds</li>
                <li>• Enable/disable thresholds dynamically</li>
                <li>• Support for multiple metrics and conditions</li>
                <li>• Configurable cooldown periods</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Delivery Tracking:</h4>
              <ul className="space-y-1">
                <li>• Real-time delivery status updates</li>
                <li>• Failed delivery retry mechanisms</li>
                <li>• Delivery acknowledgment workflow</li>
                <li>• Multi-channel delivery coordination</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}