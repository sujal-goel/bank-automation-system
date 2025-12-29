/**
 * Application Detail View Page
 * Detailed view for reviewing individual applications with document preview and comments
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/auth/auth-store';
import useNotifications from '@/hooks/useNotifications';

// Mock detailed application data
const mockApplicationDetail = {
  id: 'LA-2024-001',
  type: 'Personal Loan',
  applicantName: 'Rajesh Kumar',
  email: 'rajesh.kumar@email.com',
  phone: '+91 98765 43210',
  amount: 500000,
  status: 'pending_review',
  submittedDate: '2024-01-10T10:30:00Z',
  priority: 'high',
  riskScore: 75,
  purpose: 'Home renovation and medical expenses',
  employmentDetails: {
    company: 'Tech Solutions Pvt Ltd',
    designation: 'Senior Software Engineer',
    experience: '8 years',
    monthlyIncome: 85000,
    employmentType: 'Permanent',
  },
  personalDetails: {
    age: 32,
    maritalStatus: 'Married',
    dependents: 2,
    address: '123, MG Road, Bangalore, Karnataka - 560001',
    panNumber: 'ABCDE1234F',
    aadharNumber: '1234 5678 9012',
  },
  documents: [
    {
      id: 1,
      name: 'PAN Card',
      type: 'identity',
      status: 'verified',
      uploadedDate: '2024-01-10T10:15:00Z',
      url: '/documents/pan-card.pdf',
    },
    {
      id: 2,
      name: 'Aadhaar Card',
      type: 'identity',
      status: 'verified',
      uploadedDate: '2024-01-10T10:16:00Z',
      url: '/documents/aadhaar-card.pdf',
    },
    {
      id: 3,
      name: 'Salary Slips (Last 3 months)',
      type: 'income',
      status: 'pending_review',
      uploadedDate: '2024-01-10T10:18:00Z',
      url: '/documents/salary-slips.pdf',
    },
    {
      id: 4,
      name: 'Bank Statements (Last 6 months)',
      type: 'financial',
      status: 'verified',
      uploadedDate: '2024-01-10T10:20:00Z',
      url: '/documents/bank-statements.pdf',
    },
  ],
  comments: [
    {
      id: 1,
      author: 'Priya Sharma',
      role: 'Senior Loan Officer',
      message: 'Initial review completed. All identity documents are verified. Need to review income documents.',
      timestamp: '2024-01-11T09:15:00Z',
      type: 'review',
    },
    {
      id: 2,
      author: 'Amit Patel',
      role: 'Risk Analyst',
      message: 'Risk score calculated at 75/100. Applicant has good credit history and stable employment.',
      timestamp: '2024-01-11T14:30:00Z',
      type: 'analysis',
    },
  ],
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { showSuccess, showError } = useNotifications();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Simulate API call to fetch application details
    const fetchApplication = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setApplication(mockApplicationDetail);
      } catch (error) {
        showError('Error', 'Failed to load application details');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [params.id, showError]);

  const handleApplicationAction = async (action) => {
    setActionLoading(true);
    
    try {
      // In real implementation, make API call here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      setApplication(prev => ({ ...prev, status: newStatus }));

      if (action === 'approve') {
        showSuccess('Application Approved', `Application ${application.id} has been approved successfully`);
      } else {
        showSuccess('Application Rejected', `Application ${application.id} has been rejected`);
      }
      
      // Redirect back to review list after action
      setTimeout(() => {
        router.push('/review');
      }, 2000);
    } catch (error) {
      showError('Action Failed', 'Failed to update application status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment = {
        id: application.comments.length + 1,
        author: 'Current User', // In real app, get from auth
        role: 'Loan Officer',
        message: newComment,
        timestamp: new Date().toISOString(),
        type: 'review',
      };

      setApplication(prev => ({
        ...prev,
        comments: [...prev.comments, comment],
      }));

      setNewComment('');
      showSuccess('Comment Added', 'Your comment has been added successfully');
    } catch (error) {
      showError('Error', 'Failed to add comment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_review': return 'text-orange-600 bg-orange-50';
      case 'under_review': return 'text-blue-600 bg-blue-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'verified': return 'text-green-600 bg-green-50';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
          <p className="text-gray-600">The requested application could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Applications
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{application.type}</h1>
              <p className="text-gray-600 mt-2">Application ID: {application.id}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(application.priority)}`}>
                {application.priority} priority
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(application.status)}`}>
                {application.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Overview</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <BanknotesIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loan Amount</p>
                  <p className="text-lg font-semibold">₹{application.amount.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <ShieldCheckIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className={`text-lg font-semibold ${getRiskScoreColor(application.riskScore)}`}>
                    {application.riskScore}/100
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <CalendarIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="text-lg font-semibold">
                    {new Date(application.submittedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <UserIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Applicant Age</p>
                  <p className="text-lg font-semibold">{application.personalDetails.age} years</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Loan Purpose</h3>
                <p className="text-gray-700">{application.purpose}</p>
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {application.applicantName}</p>
                    <p><span className="font-medium">Email:</span> {application.email}</p>
                    <p><span className="font-medium">Phone:</span> {application.phone}</p>
                    <p><span className="font-medium">Address:</span> {application.personalDetails.address}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Age:</span> {application.personalDetails.age} years</p>
                    <p><span className="font-medium">Marital Status:</span> {application.personalDetails.maritalStatus}</p>
                    <p><span className="font-medium">Dependents:</span> {application.personalDetails.dependents}</p>
                    <p><span className="font-medium">PAN:</span> {application.personalDetails.panNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Employment Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p><span className="font-medium">Company:</span> {application.employmentDetails.company}</p>
                  <p><span className="font-medium">Designation:</span> {application.employmentDetails.designation}</p>
                  <p><span className="font-medium">Experience:</span> {application.employmentDetails.experience}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Employment Type:</span> {application.employmentDetails.employmentType}</p>
                  <p><span className="font-medium">Monthly Income:</span> ₹{application.employmentDetails.monthlyIncome.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
              
              <div className="space-y-3">
                {application.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded: {new Date(doc.uploadedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            {(application.status === 'pending_review' || application.status === 'under_review') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleApplicationAction('approve')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    {actionLoading ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button
                    onClick={() => handleApplicationAction('reject')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    {actionLoading ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Comments ({application.comments.length})
              </h3>
              
              {/* Add Comment */}
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Add Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {application.comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{comment.author}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{comment.role}</p>
                    <p className="text-gray-700">{comment.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedDocument.name}</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 h-96 flex items-center justify-center bg-gray-50">
              <p className="text-gray-500">Document preview would be implemented here</p>
              <p className="text-sm text-gray-400 mt-2">URL: {selectedDocument.url}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}