/**
 * Account Opening Application Page
 * Form for opening new bank accounts with KYC validation
 */

'use client';

import { useState } from 'react';
import { useRequireRole } from '@/lib/auth/auth-hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AccountApplicationForm from '@/components/customer/AccountApplicationForm';

export default function AccountApplicationPage() {
  const { hasAccess, isLoading } = useRequireRole('customer');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect to unauthorized page
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Open a New Account
          </h1>
          <p className="text-gray-600">
            Choose from our range of savings and checking accounts. 
            Complete the application with your personal information and required documents.
          </p>
        </div>

        {/* Account Application Form */}
        <AccountApplicationForm />
      </div>
    </DashboardLayout>
  );
}