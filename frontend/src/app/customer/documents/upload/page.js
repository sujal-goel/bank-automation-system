/**
 * Document Upload Demo Page
 * Standalone page to test document upload functionality
 */

'use client';

import { useState } from 'react';
import { useRequireRole } from '@/lib/auth/auth-hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DocumentUpload, BankingDocumentUpload } from '@/components/forms';

export default function DocumentUploadPage() {
  const { hasAccess, isLoading } = useRequireRole('customer');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [bankingDocuments, setBankingDocuments] = useState({});

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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Upload
          </h1>
          <p className="text-gray-600">
            Upload your documents for account verification and KYC compliance.
          </p>
        </div>

        {/* Banking Document Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <BankingDocumentUpload
            onDocumentsChange={setBankingDocuments}
          />
        </div>

        {/* General Document Upload Demo */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            General Document Upload
          </h2>
          <DocumentUpload
            onFilesChange={setUploadedFiles}
            label="Upload Any Documents"
            description="Drag and drop any files here for testing"
            maxFiles={10}
          />
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Debug Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Banking Documents:</strong>
                <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(bankingDocuments, null, 2)}
                </pre>
              </div>
              <div>
                <strong>General Files:</strong>
                <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(uploadedFiles, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}