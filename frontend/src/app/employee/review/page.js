/**
 * Employee Application Review Page
 * Application review interface for employees
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/auth/auth-store';
import useNotifications from '@/hooks/useNotifications';

// Mock applications data
const mockApplications = [
  {
    id: 'LA-2024-001',
    type: 'Personal Loan',
    applicantName: 'Rajesh Kumar',
    amount: 500000,
    status: 'pending_review',
    submittedDate: '2024-01-10',
    priority: 'high',
    documents: ['PAN Card', 'Aadhaar Card', 'Salary Slips', 'Bank Statements'],
    riskScore: 75,
  },
  {
    id: 'ACC-2024-023',
    type: 'Savings Account',
    applicantName: 'Priya Sharma',
    amount: null,
    status: 'under_review',
    submittedDate: '2024-01-12',
    priority: 'medium',
    documents: ['PAN Card', 'Aadhaar Card', 'Address Proof'],
    riskScore: 85,
  },
  {
    id: 'BL-2024-007',
    type: 'Business Loan',
    applicantName: 'Amit Patel',
    amount: 2000000,
    status: 'pending_review',
    submittedDate: '2024-01-13',
    priority: 'high',
    documents: ['Business Registration', 'GST Certificate', 'Financial Statements'],
    riskScore: 65,
  },
  {
    id: 'CC-2024-015',
    type: 'Credit Card',
    applicantName: 'Sunita Gupta',
    amount: 100000,
    status: 'approved',
    submittedDate: '2024-01-08',
    priority: 'low',
    documents: ['PAN Card', 'Aadhaar Card', 'Income Proof'],
    riskScore: 90,
  },
];

export default function ApplicationReviewPage() {
  const { hasPermission } = useAuthStore();
  const { showSuccess, showError } = useNotifications();
  const [applications, setApplications] = useState(mockApplications);
  const [filteredApplications, setFilteredApplications] = useState(mockApplications);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Filter applications
  useEffect(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.type.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(app => app.type === typeFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, typeFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_review': return 'text-orange-600 bg-orange-50';
      case 'under_review': return 'text-blue-600 bg-blue-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleApplicationAction = async (applicationId, action) => {
    setLoading(true);
    
    try {
      // In real implementation, make API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApplications(prev => prev.map(app =>
        app.id === applicationId 
          ? { ...app, status: action === 'approve' ? 'approved' : 'rejected' }
          : app,
      ));

      if (action === 'approve') {
        showSuccess('Application Approved', `Application ${applicationId} has been approved successfully`);
      } else {
        showSuccess('Application Rejected', `Application ${applicationId} has been rejected`);
      }
    } catch (error) {
      showError('Action Failed', 'Failed to update application status');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('process_applications')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to process applications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
          <p className="text-gray-600 mt-2">Review and process customer applications</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="Savings Account">Savings Account</option>
              <option value="Credit Card">Credit Card</option>
            </select>

            {/* Export Button */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Applications ({filteredApplications.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Processing...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No applications found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">
                          {application.type}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(application.priority)}`}>
                          {application.priority}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Application ID</span>
                          <p className="text-sm text-gray-900">{application.id}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Applicant</span>
                          <p className="text-sm text-gray-900">{application.applicantName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Amount</span>
                          <p className="text-sm text-gray-900">
                            {application.amount ? `₹${application.amount.toLocaleString()}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Risk Score</span>
                          <p className={`text-sm font-medium ${getRiskScoreColor(application.riskScore)}`}>
                            {application.riskScore}/100
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-500">Documents:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {application.documents.map((doc, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              <DocumentTextIcon className="w-3 h-3 mr-1" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(application.submittedDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      <Link
                        href={`/review/${application.id}`}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </Link>

                      {(application.status === 'pending_review' || application.status === 'under_review') && (
                        <>
                          <button
                            onClick={() => handleApplicationAction(application.id, 'approve')}
                            disabled={loading}
                            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            disabled={loading}
                            className="flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XCircleIcon className="w-4 h-4 mr-2" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}