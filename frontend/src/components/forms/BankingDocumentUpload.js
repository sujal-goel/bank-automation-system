/**
 * Banking Document Upload Component
 * Specialized document upload for banking KYC and application documents
 */

'use client';

import { useState } from 'react';
import DocumentUpload from './DocumentUpload';

const BANKING_DOCUMENT_TYPES = {
  identity: {
    label: 'Identity Proof',
    description: 'Aadhaar Card, PAN Card, Passport, Driving License',
    required: true,
    maxFiles: 2,
  },
  address: {
    label: 'Address Proof',
    description: 'Utility Bill, Bank Statement, Rental Agreement',
    required: true,
    maxFiles: 2,
  },
  income: {
    label: 'Income Proof',
    description: 'Salary Slips, ITR, Form 16, Bank Statements',
    required: false,
    maxFiles: 3,
  },
  photo: {
    label: 'Photograph',
    description: 'Recent passport-size photograph',
    required: true,
    maxFiles: 1,
    acceptedTypes: {
      'image/jpeg': '.jpg,.jpeg',
      'image/png': '.png',
    },
  },
  signature: {
    label: 'Signature',
    description: 'Clear signature on white paper',
    required: true,
    maxFiles: 1,
    acceptedTypes: {
      'image/jpeg': '.jpg,.jpeg',
      'image/png': '.png',
    },
  },
};

export default function BankingDocumentUpload({ 
  documentTypes = ['identity', 'address', 'income', 'photo', 'signature'],
  onDocumentsChange,
  className = '',
}) {
  const [documents, setDocuments] = useState({});
  const [errors, setErrors] = useState({});

  // Handle file changes for a specific document type
  const handleDocumentChange = (documentType, files) => {
    const updatedDocuments = {
      ...documents,
      [documentType]: files,
    };
    
    setDocuments(updatedDocuments);
    
    // Clear error for this document type if files are uploaded
    if (files.length > 0 && errors[documentType]) {
      setErrors(prev => ({
        ...prev,
        [documentType]: '',
      }));
    }
    
    // Notify parent component
    if (onDocumentsChange) {
      onDocumentsChange(updatedDocuments);
    }
  };

  // Validate all required documents
  const validateDocuments = () => {
    const newErrors = {};
    let isValid = true;

    documentTypes.forEach(type => {
      const config = BANKING_DOCUMENT_TYPES[type];
      if (config?.required) {
        const files = documents[type] || [];
        const uploadedFiles = files.filter(f => f.status === 'success');
        
        if (uploadedFiles.length === 0) {
          newErrors[type] = `${config.label} is required`;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Get upload progress for all documents
  const getOverallProgress = () => {
    const allFiles = Object.values(documents).flat();
    if (allFiles.length === 0) return 0;
    
    const totalProgress = allFiles.reduce((sum, file) => sum + (file.progress || 0), 0);
    return Math.round(totalProgress / allFiles.length);
  };

  // Get completion status
  const getCompletionStatus = () => {
    const requiredTypes = documentTypes.filter(type => BANKING_DOCUMENT_TYPES[type]?.required);
    const completedTypes = requiredTypes.filter(type => {
      const files = documents[type] || [];
      return files.some(f => f.status === 'success');
    });
    
    return {
      completed: completedTypes.length,
      total: requiredTypes.length,
      isComplete: completedTypes.length === requiredTypes.length,
    };
  };

  const completionStatus = getCompletionStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Document Upload</h3>
        <p className="text-sm text-gray-600 mt-1">
          Please upload the required documents for account verification. All documents should be clear and readable.
        </p>
        
        {/* Progress Indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Progress: {completionStatus.completed} of {completionStatus.total} required documents
            </span>
            <span className={`font-medium ${
              completionStatus.isComplete ? 'text-green-600' : 'text-gray-600'
            }`}>
              {completionStatus.isComplete ? 'Complete' : 'Incomplete'}
            </span>
          </div>
          <div className="mt-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                completionStatus.isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: `${(completionStatus.completed / completionStatus.total) * 100}%`, 
              }}
            />
          </div>
        </div>
      </div>

      {/* Document Upload Sections */}
      <div className="space-y-6">
        {documentTypes.map(type => {
          const config = BANKING_DOCUMENT_TYPES[type];
          if (!config) return null;

          return (
            <div key={type} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h4 className="text-base font-medium text-gray-900 flex items-center">
                  {config.label}
                  {config.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                  {documents[type]?.some(f => f.status === 'success') && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Uploaded
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-600">{config.description}</p>
              </div>

              <DocumentUpload
                onFilesChange={(files) => handleDocumentChange(type, files)}
                acceptedTypes={config.acceptedTypes}
                maxFiles={config.maxFiles}
                required={config.required}
                label=""
                description={`Upload ${config.label.toLowerCase()} (max ${config.maxFiles} file${config.maxFiles > 1 ? 's' : ''})`}
              />

              {/* Error Message */}
              {errors[type] && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-600">{errors[type]}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Document Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure all documents are clear and readable</li>
          <li>• Documents should be in color (not black & white)</li>
          <li>• File size should not exceed 10MB per document</li>
          <li>• Accepted formats: PDF, JPG, PNG, DOC, DOCX</li>
          <li>• All four corners of the document should be visible</li>
          <li>• Documents should not be expired</li>
        </ul>
      </div>

      {/* Validation Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={validateDocuments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Validate Documents
        </button>
      </div>
    </div>
  );
}

// Export document types for use in other components
export { BANKING_DOCUMENT_TYPES };