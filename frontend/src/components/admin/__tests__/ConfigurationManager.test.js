/**
 * Unit tests for Configuration Manager
 * Requirements: 3.3
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigurationManager from '../ConfigurationManager';

describe('ConfigurationManager', () => {
  const mockProps = {
    configurations: {
      general: {
        app_name: 'Banking App',
        app_version: '1.0.0',
        maintenance_mode: false,
        max_file_size: 10,
        session_timeout: 30,
      },
      security: {
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: false,
        max_login_attempts: 5,
        lockout_duration: 15,
        two_factor_required: false,
      },
    },
    backups: [
      {
        id: 'backup-1',
        description: 'Pre-update backup',
        created_at: '2024-01-15T10:00:00Z',
        size: 1024,
      },
      {
        id: 'backup-2',
        description: 'Weekly backup',
        created_at: '2024-01-10T02:00:00Z',
        size: 2048,
      },
    ],
    onConfigurationChange: jest.fn(),
    onCreateBackup: jest.fn(),
    onRestoreBackup: jest.fn(),
    onResetToDefaults: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders configuration sections correctly', () => {
    render(<ConfigurationManager {...mockProps} />);

    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
    expect(screen.getByText('Database Settings')).toBeInTheDocument();
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
  });

  test('displays configuration values correctly', () => {
    render(<ConfigurationManager {...mockProps} />);

    // Check general settings values
    expect(screen.getByDisplayValue('Banking App')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1.0.0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  test('handles configuration changes', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    const appNameInput = screen.getByDisplayValue('Banking App');
    await user.clear(appNameInput);
    await user.type(appNameInput, 'New Banking App');

    expect(mockProps.onConfigurationChange).toHaveBeenCalledWith(
      'general',
      'app_name',
      'New Banking App',
    );
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    const appNameInput = screen.getByDisplayValue('Banking App');
    await user.clear(appNameInput);

    // Should show validation error for empty required field
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  test('validates number ranges', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    const fileSizeInput = screen.getByDisplayValue('10');
    await user.clear(fileSizeInput);
    await user.type(fileSizeInput, '200');

    // Should show validation error for value exceeding maximum
    await waitFor(() => {
      expect(screen.getByText('Maximum value is 100')).toBeInTheDocument();
    });
  });

  test('switches between configuration tabs', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    // Switch to security tab
    await user.click(screen.getByText('Security Settings'));

    // Should show security settings
    expect(screen.getByText('Minimum Password Length')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
  });

  test('opens backup creation dialog', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    await user.click(screen.getByText('Create Backup'));

    expect(screen.getByText('Create Configuration Backup')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter backup description...')).toBeInTheDocument();
  });

  test('creates backup with description', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    await user.click(screen.getByText('Create Backup'));

    const descriptionInput = screen.getByPlaceholderText('Enter backup description...');
    await user.type(descriptionInput, 'Test backup');

    await user.click(screen.getAllByText('Create Backup')[1]); // Second button in dialog

    expect(mockProps.onCreateBackup).toHaveBeenCalledWith('Test backup');
  });

  test('opens restore dialog with backup list', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    await user.click(screen.getByText('Restore'));

    expect(screen.getByText('Restore Configuration')).toBeInTheDocument();
    expect(screen.getByText('Pre-update backup')).toBeInTheDocument();
    expect(screen.getByText('Weekly backup')).toBeInTheDocument();
  });

  test('restores selected backup', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    await user.click(screen.getByText('Restore'));
    await user.click(screen.getByText('Pre-update backup'));
    await user.click(screen.getByText('Restore Selected'));

    expect(mockProps.onRestoreBackup).toHaveBeenCalledWith('backup-1');
  });

  test('disables restore button when no backups available', () => {
    const propsWithoutBackups = {
      ...mockProps,
      backups: [],
    };

    render(<ConfigurationManager {...propsWithoutBackups} />);

    expect(screen.getByText('Restore')).toBeDisabled();
  });

  test('opens reset confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    await user.click(screen.getByText('Reset to Defaults'));

    expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
  });

  test('resets to defaults after confirmation', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    await user.click(screen.getByText('Reset to Defaults'));
    await user.click(screen.getAllByText('Reset to Defaults')[1]); // Second button in dialog

    expect(mockProps.onResetToDefaults).toHaveBeenCalled();
  });

  test('filters configurations based on search term', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    const searchInput = screen.getByPlaceholderText('Search configuration settings...');
    await user.type(searchInput, 'password');

    // Should filter to show only security-related settings
    expect(screen.queryByText('General Settings')).not.toBeInTheDocument();
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
  });

  test('handles boolean configuration changes', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    // Switch to general tab and find maintenance mode checkbox
    const maintenanceCheckbox = screen.getByRole('checkbox', { name: /maintenance mode/i });
    await user.click(maintenanceCheckbox);

    expect(mockProps.onConfigurationChange).toHaveBeenCalledWith(
      'general',
      'maintenance_mode',
      true,
    );
  });

  test('validates email format in notification settings', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    // Switch to notifications tab
    await user.click(screen.getByText('Notification Settings'));

    const emailInput = screen.getByLabelText(/from email address/i);
    await user.type(emailInput, 'invalid-email');

    await waitFor(() => {
      expect(screen.getByText('Invalid format')).toBeInTheDocument();
    });
  });

  test('closes dialogs when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfigurationManager {...mockProps} />);

    // Test backup dialog
    await user.click(screen.getByText('Create Backup'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create Configuration Backup')).not.toBeInTheDocument();

    // Test restore dialog
    await user.click(screen.getByText('Restore'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Restore Configuration')).not.toBeInTheDocument();

    // Test reset dialog
    await user.click(screen.getByText('Reset to Defaults'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('This action cannot be undone')).not.toBeInTheDocument();
  });
});