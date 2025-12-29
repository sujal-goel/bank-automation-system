/**
 * Loan Application Page
 * Multi-step wizard for loan applications
 */

'use client';


import { useRequireRole } from '@/lib/auth/auth-hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoanApplicationWizard from '@/components/customer/LoanApplicationWizard';

export default function LoanApplicationPage() {
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
            Apply for a Loan
          </h1>
          <p className="text-gray-600">
            Complete this application to apply for a personal or business loan. 
            The process typically takes 5-10 minutes.
          </p>
        </div>

        {/* Loan Application Wizard */}
        <LoanApplicationWizard />
      </div>
    </DashboardLayout>
  );
}