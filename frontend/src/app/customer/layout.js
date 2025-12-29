/**
 * Customer Route Group Layout
 * Mobile-optimized layout wrapper for customer-specific routes
 */

import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

export default function CustomerLayout({ children }) {
  return (
    <ResponsiveLayout>
      {children}
    </ResponsiveLayout>
  );
}