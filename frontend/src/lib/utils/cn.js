import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * @param {...(string|object|Array)} inputs - Class names to merge
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to create conditional classes
 * @param {string} baseClasses - Base classes to always apply
 * @param {object} conditionalClasses - Object with condition: classes pairs
 * @returns {string} - Merged class names
 */
export function conditionalClasses(baseClasses, conditionalClasses) {
  const classes = [baseClasses];
  
  Object.entries(conditionalClasses).forEach(([condition, classNames]) => {
    if (condition) {
      classes.push(classNames);
    }
  });
  
  return cn(...classes);
}

/**
 * Utility function for variant-based styling
 * @param {object} variants - Object with variant definitions
 * @param {object} props - Props containing variant values
 * @param {string} defaultVariant - Default variant to use
 * @returns {string} - Merged class names
 */
export function createVariants(variants, props, defaultVariant = 'default') {
  const classes = [];
  
  Object.entries(variants).forEach(([variantName, variantOptions]) => {
    const selectedVariant = props[variantName] || defaultVariant;
    if (variantOptions[selectedVariant]) {
      classes.push(variantOptions[selectedVariant]);
    }
  });
  
  return cn(...classes);
}