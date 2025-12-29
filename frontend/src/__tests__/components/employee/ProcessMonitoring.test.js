/**
 * Process Monitoring Component Tests
 * Tests for the process monitoring dashboard functionality
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProcessMonitoringPage from '@/app/(employee)/processes/page';
import ProcessHistoryModal from '@/components/employee/ProcessHistoryModal';
import useAuthStore from '@/lib/auth/auth-store';
import useNotifications from '@/hooks/useNotifications';

// Mock the auth store
jest.mock('@/lib/auth/auth-store');
jest.mock('@/hooks/useNotifications');

const mockAuthStore = {
  hasPermission: jest.fn(),
};

const mockNotifications = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
};

describe('Process Monitoring Dashboard', () => {
  beforeEach(() => {
    useAuthStore.mockReturnValue(mockAuthStore);
    useNotifications.mockReturnValue(mockNotifications);
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should render access denied when user lacks permission', () => {
    mockAuthStore.hasPermission.mockReturnValue(false);

    render(<ProcessMonitoringPage />);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to monitor processes.")).toBeInTheDocument();
  });

  test('should render process monitoring dashboard when user has permission', async () => {
    mockAuthStore.hasPermission.mockReturnValue(true);

    render(<ProcessMonitoringPage />);

    // Fast-forward past the loading timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Process Monitoring')).toBeInTheDocument();
    });

    expect(screen.getByText('Monitor and control automated banking processes')).toBeInTheDocument();
    expect(screen.getByText('Active Processes')).toBeInTheDocument();
  });

  test('should display process overview cards', async () => {
    mockAuthStore.hasPermission.mockReturnValue(true);

    render(<ProcessMonitoringPage />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      // Look for the specific overview card structure
      const overviewCards = screen.getAllByText(/Running|Paused|Errors|Avg Success Rate/);
      expect(overviewCards.length).toBeGreaterThan(0);
    });
  });

  test('should display process cards with correct information', async () => {
    mockAuthStore.hasPermission.mockReturnValue(true);

    render(<ProcessMonitoringPage />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('KYC Document Verification')).toBeInTheDocument();
      expect(screen.getByText('Loan Application Processing')).toBeInTheDocument();
      expect(screen.getByText('AML Compliance Screening')).toBeInTheDocument();
    });
  });

  test('should handle process actions correctly', async () => {
    mockAuthStore.hasPermission.mockReturnValue(true);

    render(<ProcessMonitoringPage />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('KYC Document Verification')).toBeInTheDocument();
    });

    // Find and click a pause button (should be available for running processes)
    const pauseButtons = screen.getAllByTitle('Pause Process');
    if (pauseButtons.length > 0) {
      fireEvent.click(pauseButtons[0]);

      // Fast-forward the action timeout
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockNotifications.showSuccess).toHaveBeenCalledWith('Process paused successfully');
      });
    }
  });

  test('should refresh process data when refresh button is clicked', async () => {
    mockAuthStore.hasPermission.mockReturnValue(true);

    render(<ProcessMonitoringPage />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Button should be disabled during refresh
    expect(refreshButton).toBeDisabled();
  });
});

describe('Process History Modal', () => {
  test('should not render when closed', () => {
    render(
      <ProcessHistoryModal
        isOpen={false}
        onClose={jest.fn()}
        processId="test-id"
        processName="Test Process"
      />,
    );

    expect(screen.queryByText('Process History')).not.toBeInTheDocument();
  });

  test('should render when open', () => {
    render(
      <ProcessHistoryModal
        isOpen={true}
        onClose={jest.fn()}
        processId="test-id"
        processName="Test Process"
      />,
    );

    expect(screen.getByText('Process History')).toBeInTheDocument();
    expect(screen.getByText('Test Process')).toBeInTheDocument();
  });

  test('should display history entries', () => {
    render(
      <ProcessHistoryModal
        isOpen={true}
        onClose={jest.fn()}
        processId="test-id"
        processName="Test Process"
      />,
    );

    expect(screen.getByText('Process Started')).toBeInTheDocument();
    expect(screen.getByText('Manual Intervention')).toBeInTheDocument();
    expect(screen.getByText('Error Resolved')).toBeInTheDocument();
  });

  test('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();

    render(
      <ProcessHistoryModal
        isOpen={true}
        onClose={mockOnClose}
        processId="test-id"
        processName="Test Process"
      />,
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should handle export functionality', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <ProcessHistoryModal
        isOpen={true}
        onClose={jest.fn()}
        processId="test-id"
        processName="Test Process"
      />,
    );

    const exportButton = screen.getByText('Export History');
    fireEvent.click(exportButton);

    expect(consoleSpy).toHaveBeenCalledWith('Exporting process history...');

    consoleSpy.mockRestore();
  });
});