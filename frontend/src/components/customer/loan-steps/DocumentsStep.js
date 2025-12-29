/**
 * Documents Step
 * Fourth step of loan application wizard
 */

'use client';

import { useState, useEffect } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DocumentsStep({ data, updateData, updateValidation, errors }) {
  const [uploadedDocuments, setUploadedDocuments] = useState(data.documents || []);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const requiredDocuments = [
    {
      id: 'id_verification',
      name: 'Government-issued ID',
      description: 'Driver\'s license, passport, or state ID',
      required: true,
    },
    {
      id: 'income_verification',
      name: 'Income Verification',
      description: 'Recent pay stubs, tax returns, or employment letter',
      required: true,
    },
    {
      id: 'bank_statements',
      name: 'Bank Statements',
      description: 'Last 3 months of bank statements',
      required: true,
    },
    {
      id: 'proof_of_address',
      name: 'Proof of Address',
      description: 'Utility bill, lease agreement, or mortgage statement',
      required: false,
    },
  ];

  const validateDocuments = () => {
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const uploadedTypes = uploadedDocuments.map(doc => doc.type);
    const missingRequired = requiredDocs.filter(doc => !uploadedTypes.includes(doc.id));
    
    const isValid = missingRequired.length === 0;
    const errors = missingRequired.length > 0 ? {
      documents: `Missing required documents: ${missingRequired.map(doc => doc.name).join(', ')}`,
    } : {};
    
    updateValidation(isValid, errors);
    return isValid;
  };

  const handleFileUpload = async (files, documentType) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only PDF, JPEG, or PNG files.');
        continue;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        continue;
      }

      const documentId = Date.now() + Math.random();
      
      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
      
      // Simulate file upload
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(prev => ({ ...prev, [documentId]: progress }));
      }

      const newDocument = {
        id: documentId,
        name: file.name,
        type: documentType,
        size: file.size,
        uploadDate: new Date().toISOString(),
        file: file, // In real app, this would be a URL after upload
      };

      setUploadedDocuments(prev => {
        const updated = [...prev, newDocument];
        updateData('documents', updated);
        return updated;
      });

      // Remove from progress tracking
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[documentId];
        return updated;
      });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e, documentType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files, documentType);
    }
  };

  const removeDocument = (documentId) => {
    setUploadedDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== documentId);
      updateData('documents', updated);
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentsByType = (type) => {
    return uploadedDocuments.filter(doc => doc.type === type);
  };

  // Validate on mount and when documents change
  useEffect(() => {
    validateDocuments();
  }, [uploadedDocuments]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Required Documents</h2>
        <p className="text-gray-600">
          Please upload the required documents to complete your loan application. 
          All documents should be clear and legible.
        </p>
      </div>

      <div className="space-y-6">
        {requiredDocuments.map((docType) => {
          const uploadedDocs = getDocumentsByType(docType.id);
          const hasUploaded = uploadedDocs.length > 0;

          return (
            <div key={docType.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    {docType.name}
                    {docType.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                </div>
                {hasUploaded && (
                  <div className="flex items-center text-green-600">
                    <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Uploaded</span>
                  </div>
                )}
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : hasUploaded
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, docType.id)}
              >
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor={`file-upload-${docType.id}`} className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Drop files here or click to upload
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PDF, JPEG, PNG up to 5MB
                    </span>
                  </label>
                  <input
                    id={`file-upload-${docType.id}`}
                    name={`file-upload-${docType.id}`}
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e.target.files, docType.id)}
                  />
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedDocs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Uploaded Files:</h4>
                  {uploadedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.size)} • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress */}
              {Object.entries(uploadProgress).map(([docId, progress]) => (
                <div key={docId} className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {errors.documents && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{errors.documents}</p>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Document Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Ensure all documents are clear and legible</li>
          <li>• Documents should be recent (within the last 3 months for statements)</li>
          <li>• Personal information should be visible and match your application</li>
          <li>• File formats: PDF, JPEG, or PNG only</li>
          <li>• Maximum file size: 5MB per document</li>
        </ul>
      </div>
    </div>
  );
}