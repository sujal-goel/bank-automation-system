/**
 * Document Upload Component
 * Drag-and-drop file upload with progress tracking and preview
 * Supports multiple file types for banking documents
 */

'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} UploadedFile
 * @property {File} file - The original file object
 * @property {string} id - Unique identifier
 * @property {string} name - File name
 * @property {number} size - File size in bytes
 * @property {string} type - MIME type
 * @property {'uploading'|'success'|'error'|'pending'} status - Upload status
 * @property {number} progress - Upload progress (0-100)
 * @property {string} [url] - File URL after upload
 * @property {string} [error] - Error message if upload failed
 * @property {string} [preview] - Preview URL for images
 */

const ACCEPTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export default function DocumentUpload({ 
  onFilesChange, 
  acceptedTypes = ACCEPTED_FILE_TYPES,
  maxFiles = MAX_FILES,
  maxFileSize = MAX_FILE_SIZE,
  required = false,
  label = 'Upload Documents',
  description = 'Drag and drop files here, or click to select files',
  className = '',
}) {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const baseId = useId();

  // Generate unique ID for files
  const generateFileId = useCallback(() => {
    return `${baseId}-${Date.now()}`;
  }, [baseId]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file) => {
    const errors = [];

    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File size must be less than ${formatFileSize(maxFileSize)}`);
    }

    // Check file type
    if (!Object.keys(acceptedTypes).includes(file.type)) {
      const allowedExtensions = Object.values(acceptedTypes).join(', ');
      errors.push(`File type not supported. Allowed types: ${allowedExtensions}`);
    }

    return errors;
  };

  // Create file preview for images
  const createPreview = (file) => {
    if (typeof window !== 'undefined' && file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Handle file selection
  const handleFiles = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles = [];
    let hasErrors = false;

    fileArray.forEach(file => {
      const validationErrors = validateFile(file);
      
      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        hasErrors = true;
        return;
      }

      const fileObj = {
        id: generateFileId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        preview: createPreview(file),
      };

      newFiles.push(fileObj);
    });

    if (!hasErrors) {
      setError('');
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      
      // Notify parent component
      if (onFilesChange) {
        onFilesChange(updatedFiles);
      }

      // Start upload simulation for each new file
      newFiles.forEach(fileObj => {
        simulateUpload(fileObj.id);
      });
    }
  }, [files, maxFiles, maxFileSize, acceptedTypes, onFilesChange]);

  // Simulate file upload with progress
  const simulateUpload = (fileId) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, status: 'uploading', progress: 0 }
          : file,
      ),
    );

    // Simulate upload progress
    const interval = setInterval(() => {
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.map(file => {
          if (file.id === fileId && file.status === 'uploading') {
            const newProgress = Math.min(file.progress + Math.random() * 30, 100);
            
            if (newProgress >= 100) {
              clearInterval(interval);
              return {
                ...file,
                status: 'success',
                progress: 100,
                url: `https://example.com/uploads/${file.name}`, // Mock URL
              };
            }
            
            return { ...file, progress: newProgress };
          }
          return file;
        });

        // Notify parent of changes
        if (onFilesChange) {
          onFilesChange(updatedFiles);
        }

        return updatedFiles;
      });
    }, 200);
  };

  // Remove file
  const removeFile = (fileId) => {
    const updatedFiles = files.filter(file => {
      if (file.id === fileId) {
        // Clean up preview URL (only in browser)
        if (typeof window !== 'undefined' && file.preview) {
          URL.revokeObjectURL(file.preview);
        }
        return false;
      }
      return true;
    });
    
    setFiles(updatedFiles);
    setError('');
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📄';
    } else if (fileType.includes('word')) {
      return '📝';
    }
    return '📎';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.values(acceptedTypes).join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: {Object.values(acceptedTypes).join(', ')} 
          (Max {formatFileSize(maxFileSize)} each)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg border"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0 mr-3">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded text-lg">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(file.progress)}% uploaded
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Status and Actions */}
                <div className="flex items-center space-x-2 ml-3">
                  {getStatusIcon(file.status)}
                  
                  {/* Preview Button for Images */}
                  {file.preview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.preview, '_blank');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Preview"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Remove file"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {files.length > 0 && (
        <div className="text-xs text-gray-500">
          {files.filter(f => f.status === 'success').length} of {files.length} files uploaded successfully
        </div>
      )}
    </div>
  );
}