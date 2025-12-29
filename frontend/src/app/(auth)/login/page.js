/**
 * Login Page
 * Provides authentication interface for all user types
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-hooks';
import LoginForm from '@/components/auth/LoginForm';
import DemoAccounts from '@/components/auth/DemoAccounts';

// Login content component that uses useSearchParams
function LoginContent() {
  const [activeTab, setActiveTab] = useState('customer');
  const { isAuthenticated, isLoading, hasHydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  // Redirect if already authenticated
  useEffect(() => {
    if (hasHydrated && !isLoading && isAuthenticated) {
      router.push(redirectTo || '/');
    }
  }, [isAuthenticated, isLoading, hasHydrated, router, redirectTo]);

  // Show loading while hydrating or loading
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              create a new account
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

          {/* Login Form */}
          <LoginForm userType={activeTab} redirectTo={redirectTo} />

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <DemoAccounts userType={activeTab} />
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
          >
            Forgot your password?
          </Link>
          <div className="text-xs text-gray-500">
            <Link
              href="/privacy"
              className="hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </Link>
            {' • '}
            <Link
              href="/terms"
              className="hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Main page component - this is what Next.js expects as default export
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}