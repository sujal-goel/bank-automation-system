/**
 * Basic smoke tests for Configuration Manager
 * Requirements: 3.3
 */

import { render, screen } from '@testing-library/react';
import ConfigurationManager from '../ConfigurationManager';

describe('ConfigurationManager Basic Tests', () => {
  const mockProps = {
    configurations: {
      general: {
        app_name: 'Banking App',
        app_version: '1.0.0',
        maintenance_mode: false,
        max_file_size: 10,
        session_timeout: 30,
      },
    },
    backups: [],
    onConfigurationChange: jest.fn(),
    onCreateBackup: jest.fn(),
    onRestoreBackup: jest.fn(),
    onResetToDefaults: jest.fn(),
    loading: false,
  };

  test('renders without crashing', () => {
    render(<ConfigurationManager {...mockProps} />);
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  test('displays configuration sections', () => {
    render(<ConfigurationManager {...mockProps} />);
    
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
    expect(screen.getByText('Database Settings')).toBeInTheDocument();
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
  });

  test('shows action buttons', () => {
    render(<ConfigurationManager {...mockProps} />);
    
    expect(screen.getByText('Create Backup')).toBeInTheDocument();
    expect(screen.getByText('Restore')).toBeInTheDocument();
    expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
  });

  test('shows search functionality', () => {
    render(<ConfigurationManager {...mockProps} />);
    
    expect(screen.getByPlaceholderText('Search configuration settings...')).toBeInTheDocument();
  });
});