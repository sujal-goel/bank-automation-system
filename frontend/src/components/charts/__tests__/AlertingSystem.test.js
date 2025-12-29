/**
 * Unit Tests for Alerting System Components
 * Tests the core functionality of the alerting system
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AlertingSystem from '../AlertingSystem';
import ThresholdConfigModal from '../ThresholdConfigModal';
import AlertDeliverySystem from '../AlertDeliverySystem';

// Mock the API client
jest.mock('../../../lib/api/client', () => ({
  apiClient: {
    request: jest.fn(),
  },
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  BellIcon: () => <div data-testid="bell-icon">Bell</div>,
  ExclamationTriangleIcon: () => <div data-testid="warning-icon">Warning</div>,
  CheckCircleIcon: () => <div data-testid="check-icon">Check</div>,
  XCircleIcon: () => <div data-testid="x-icon">X</div>,
  CogIcon: () => <div data-testid="cog-icon">Cog</div>,
  ClockIcon: () => <div data-testid="clock-icon">Clock</div>,
  EnvelopeIcon: () => <div data-testid="envelope-icon">Envelope</div>,
  DevicePhoneMobileIcon: () => <div data-testid="phone-icon">Phone</div>,
  EyeIcon: () => <div data-testid="eye-icon">Eye</div>,
  TrashIcon: () => <div data-testid="trash-icon">Trash</div>,
  PlusIcon: () => <div data-testid="plus-icon">Plus</div>,
  XMarkIcon: () => <div data-testid="x-mark-icon">X Mark</div>,
  InformationCircleIcon: () => <div data-testid="info-icon">Info</div>,
  ArrowPathIcon: () => <div data-testid="refresh-icon">Refresh</div>,
  ChevronDownIcon: () => <div data-testid="chevron-down-icon">Down</div>,
  ChevronRightIcon: () => <div data-testid="chevron-right-icon">Right</div>,
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithQueryClient = (component) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>,
  );
};

describe('AlertingSystem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders alerting system with tabs', () => {
    renderWithQueryClient(<AlertingSystem />);
    
    expect(screen.getByText('Alert Management')).toBeInTheDocument();
    expect(screen.getByText('Active Alerts')).toBeInTheDocument();
    expect(screen.getByText('Thresholds')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  test('switches between tabs correctly', () => {
    renderWithQueryClient(<AlertingSystem />);
    
    // Click on Thresholds tab
    fireEvent.click(screen.getByText('Thresholds'));
    
    // Should show thresholds content (loading state initially)
    expect(screen.getByText('Thresholds')).toHaveClass('bg-white');
  });

  test('displays loading state initially', () => {
    renderWithQueryClient(<AlertingSystem />);
    
    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('ThresholdConfigModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal when open', () => {
    renderWithQueryClient(
      <ThresholdConfigModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />,
    );
    
    expect(screen.getByText('Create Alert Threshold')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Threshold Configuration')).toBeInTheDocument();
    expect(screen.getByText('Delivery Channels')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderWithQueryClient(
      <ThresholdConfigModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />,
    );
    
    expect(screen.queryByText('Create Alert Threshold')).not.toBeInTheDocument();
  });

  test('shows edit mode when threshold is provided', () => {
    const mockThreshold = {
      id: 'test-1',
      name: 'Test Threshold',
      metric: 'cpu_usage',
      condition: 'above',
      value: 90,
      severity: 'critical',
      enabled: true,
      channels: ['email'],
      recipients: ['test@example.com'],
      cooldown: 15,
      description: 'Test description',
    };

    renderWithQueryClient(
      <ThresholdConfigModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        threshold={mockThreshold}
      />,
    );
    
    expect(screen.getByText('Edit Alert Threshold')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Threshold')).toBeInTheDocument();
  });

  test('handles form input changes', () => {
    renderWithQueryClient(
      <ThresholdConfigModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />,
    );
    
    const nameInput = screen.getByPlaceholderText('e.g., High CPU Usage');
    fireEvent.change(nameInput, { target: { value: 'New Threshold' } });
    
    expect(nameInput.value).toBe('New Threshold');
  });

  test('closes modal when cancel is clicked', () => {
    renderWithQueryClient(
      <ThresholdConfigModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />,
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('AlertDeliverySystem Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response
    require('../../../lib/api/client').apiClient.request.mockResolvedValue({
      data: [
        {
          id: 'delivery-1',
          alertId: 'alert-1',
          channel: 'email',
          recipient: 'test@example.com',
          status: 'delivered',
          timestamp: new Date().toISOString(),
          deliveredAt: new Date().toISOString(),
          retryCount: 0,
        },
      ],
    });
  });

  test('renders delivery system with statistics', async () => {
    renderWithQueryClient(
      <AlertDeliverySystem alertId="alert-1" onClose={mockOnClose} />,
    );
    
    // Should show loading initially
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    
    // Wait for data to load and check for the header
    await waitFor(() => {
      expect(screen.getByText('Alert Delivery Status')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Track delivery status across all channels')).toBeInTheDocument();
  });

  test('displays delivery statistics when data loads', async () => {
    renderWithQueryClient(
      <AlertDeliverySystem alertId="alert-1" onClose={mockOnClose} />,
    );
    
    await waitFor(() => {
      expect(screen.getByText('Total Deliveries')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  test('handles acknowledge alert action', async () => {
    const mockMutate = jest.fn();
    require('../../../lib/api/client').apiClient.request.mockResolvedValue({ success: true });

    renderWithQueryClient(
      <AlertDeliverySystem alertId="alert-1" onClose={mockOnClose} />,
    );
    
    await waitFor(() => {
      const acknowledgeButton = screen.getByText('Acknowledge Alert');
      expect(acknowledgeButton).toBeInTheDocument();
    });
  });

  test('closes when close button is clicked', async () => {
    renderWithQueryClient(
      <AlertDeliverySystem alertId="alert-1" onClose={mockOnClose} />,
    );
    
    await waitFor(() => {
      const closeButton = screen.getByTestId('x-icon').parentElement;
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

describe('Alerting System Integration', () => {
  test('all components can be rendered together', async () => {
    const { rerender } = renderWithQueryClient(<AlertingSystem />);
    expect(screen.getByText('Alert Management')).toBeInTheDocument();
    
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <ThresholdConfigModal isOpen={true} onClose={() => {}} onSave={() => {}} />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Create Alert Threshold')).toBeInTheDocument();
    
    // Mock successful API response for AlertDeliverySystem
    require('../../../lib/api/client').apiClient.request.mockResolvedValue({
      data: [],
    });
    
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <AlertDeliverySystem alertId="test-alert" onClose={() => {}} />
      </QueryClientProvider>,
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Alert Delivery Status')).toBeInTheDocument();
    });
  });
});