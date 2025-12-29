/**
 * Registration Page
 * Provides registration interface for all user types
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-hooks';
import CustomerRegistration from '@/components/auth/CustomerRegistration';
import EmployeeRegistration from '@/components/auth/EmployeeRegistration';
import AdminRegistration from '@/components/auth/AdminRegistration';

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState('customer');
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  const renderRegistrationForm = () => {
    switch (activeTab) {
      case 'customer':
        return <CustomerRegistration />;
      case 'employee':
        return <EmployeeRegistration />;
      case 'admin':
        return <AdminRegistration />;
      default:
        return <CustomerRegistration />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* User Type Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            {[
              { id: 'customer', label: 'Customer' },
              { id: 'employee', label: 'Employee' },
              { id: 'admin', label: 'Admin' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Registration Form */}
          {renderRegistrationForm()}
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 space-y-2">
          <div className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link
              href="/terms"
              className="text-blue-600 hover:text-blue-500 transition-colors"
            >
              Terms of Service
            </Link>
            {' and '}
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-500 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}