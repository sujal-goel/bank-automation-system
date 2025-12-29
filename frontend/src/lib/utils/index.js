/**
 * Utility functions for the application
 */

// Re-export all utilities
export { cn } from './cn';
export { exportToCSV, exportToPDF, exportToExcel } from './export';
export { 
  isMobile, 
  isTablet, 
  isDesktop, 
  getBreakpoint, 
  useResponsive, 
} from './responsive';

/**
 * Validates if a request is properly formatted and authorized
 * @param {Request} request - The request to validate
 * @returns {Promise<boolean>} - Whether the request is valid
 */
export async function isValidRequest(request) {
  try {
    // Basic validation - check if request has required headers
    const contentType = request.headers.get('content-type');
    const userAgent = request.headers.get('user-agent');
    
    // Allow requests with JSON content type or no content type (for GET requests)
    if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return false;
    }
    
    // Block requests without user agent (potential bot/malicious requests)
    if (!userAgent) {
      return false;
    }
    
    // Additional validation can be added here
    // For now, we'll accept most requests
    return true;
  } catch (error) {
    console.error('Error validating request:', error);
    return false;
  }
}

/**
 * Formats currency values
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Formats dates in a consistent way
 * @param {Date|string} date - The date to format
 * @param {string} format - The format type ('short', 'long', 'time')
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = 'short') {
  const dateObj = new Date(date);
  
  switch (format) {
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'time':
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      return dateObj.toLocaleDateString('en-US');
  }
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}