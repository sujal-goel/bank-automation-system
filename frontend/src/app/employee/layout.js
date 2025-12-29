/**
 * Employee Layout
 * Mobile-optimized layout wrapper for employee pages with navigation and role-based features
 */

import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

export default function EmployeeLayout({ children }) {
  return (
    <ResponsiveLayout>
      {children}
    </ResponsiveLayout>
  );
}