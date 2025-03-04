// src/utils/validationUtils.js

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate a password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with errors and strength
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    errors: [],
    strength: 'weak'
  };
  
  if (!password) {
    result.errors.push('Password is required');
    return result;
  }
  
  // Length check
  if (password.length < 8) {
    result.errors.push('Password must be at least 8 characters');
  }
  
  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
  }
  
  // Number check
  if (!/\d/.test(password)) {
    result.errors.push('Password must contain at least one number');
  }
  
  // Special character check (optional)
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password should contain at least one special character');
  }
  
  // Calculate strength
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
  
  if (strength >= 5) {
    result.strength = 'strong';
  } else if (strength >= 3) {
    result.strength = 'medium';
  }
  
  // Set isValid if no errors
  result.isValid = result.errors.length === 0;
  
  return result;
};

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validate if a value exists
 * @param {any} value - Value to check
 * @returns {boolean} Whether the value exists and is not empty
 */
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Validate if a value is a number
 * @param {any} value - Value to check
 * @returns {boolean} Whether the value is a number
 */
export const isNumber = (value) => {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') return !isNaN(parseFloat(value)) && isFinite(value);
  return false;
};

/**
 * Validate a form input value
 * @param {string} name - Input name
 * @param {any} value - Input value
 * @param {object} options - Validation options
 * @returns {string|null} Error message or null if valid
 */
export const validateInput = (name, value, options = {}) => {
  const {
    required = false,
    minLength,
    maxLength,
    min,
    max,
    pattern,
    type
  } = options;
  
  // Required check
  if (required && !isNotEmpty(value)) {
    return `${name} is required`;
  }
  
  // Skip other validations if empty and not required
  if (!isNotEmpty(value) && !required) {
    return null;
  }
  
  // Type checks
  if (type === 'email' && !isValidEmail(value)) {
    return `${name} must be a valid email`;
  }
  
  if (type === 'url' && !isValidUrl(value)) {
    return `${name} must be a valid URL`;
  }
  
  if (type === 'number' && !isNumber(value)) {
    return `${name} must be a number`;
  }
  
  // String validations
  if (typeof value === 'string') {
    if (minLength !== undefined && value.length < minLength) {
      return `${name} must be at least ${minLength} characters`;
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      return `${name} must be no more than ${maxLength} characters`;
    }
    
    if (pattern && !new RegExp(pattern).test(value)) {
      return `${name} is not in the correct format`;
    }
  }
  
  // Numeric validations
  if (typeof value === 'number' || (typeof value === 'string' && isNumber(value))) {
    const numValue = parseFloat(value);
    
    if (min !== undefined && numValue < min) {
      return `${name} must be at least ${min}`;
    }
    
    if (max !== undefined && numValue > max) {
      return `${name} must be no more than ${max}`;
    }
  }
  
  return null; // No error
};
