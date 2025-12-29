/**
 * Admin Layout
 * Mobile-optimized layout wrapper for admin pages with navigation and role-based features
 */

import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

export default function AdminLayout({ children }) {
  return (
    <ResponsiveLayout>
      {children}
    </ResponsiveLayout>
  );
}