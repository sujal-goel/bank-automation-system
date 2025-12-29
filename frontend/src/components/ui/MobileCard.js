/**
 * Mobile-Optimized Card Component
 * Responsive card with touch-friendly interactions
 */

'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

const MobileCard = forwardRef(({ 
  children, 
  className, 
  clickable = false, 
  onClick,
  padding = 'default',
  shadow = 'default',
  ...props 
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg border border-gray-200',
        paddingClasses[padding],
        shadowClasses[shadow],
        clickable && 'cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.98] touch-target',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});

MobileCard.displayName = 'MobileCard';

export default MobileCard;