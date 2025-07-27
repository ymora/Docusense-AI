/**
 * Validation utilities for DocuSense AI frontend
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

/**
 * Validates a string value
 */
export function validateString(value: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a number value
 */
export function validateNumber(value: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  // Check if it's a valid number first
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push('Value must be a valid number');
    return { isValid: false, errors };
  }

  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      errors: ['Email is required'],
    };
  }

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      errors: ['Invalid email format'],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Validates a file path
 */
export function validateFilePath(path: string): ValidationResult {
  if (!path || typeof path !== 'string') {
    return {
      isValid: false,
      errors: ['File path is required'],
    };
  }

  const errors: string[] = [];

  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(path)) {
    errors.push('File path contains invalid characters');
  }

  // Check for relative path traversal
  if (path.includes('..') || path.includes('./')) {
    errors.push('Relative path traversal not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a directory path
 */
export function validateDirectoryPath(path: string): ValidationResult {
  if (!path || typeof path !== 'string') {
    return {
      isValid: false,
      errors: ['Directory path is required'],
    };
  }

  const errors: string[] = [];

  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(path)) {
    errors.push('Directory path contains invalid characters');
  }

  // Check for relative path traversal
  if (path.includes('..') || path.includes('./')) {
    errors.push('Relative path traversal not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates API key format
 */
export function validateApiKey(apiKey: string, provider: string): ValidationResult {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      isValid: false,
      errors: ['API key is required'],
    };
  }

  const errors: string[] = [];

  // Provider-specific validation
  switch (provider.toLowerCase()) {
    case 'openai':
      if (!apiKey.startsWith('sk-')) {
        errors.push('OpenAI API key must start with "sk-"');
      }
      if (apiKey.length < 20) {
        errors.push('OpenAI API key seems too short');
      }
      break;

    case 'claude':
      if (!apiKey.startsWith('sk-ant-')) {
        errors.push('Claude API key must start with "sk-ant-"');
      }
      if (apiKey.length < 20) {
        errors.push('Claude API key seems too short');
      }
      break;

    case 'mistral':
      if (!apiKey.startsWith('mistral-')) {
        errors.push('Mistral API key must start with "mistral-"');
      }
      if (apiKey.length < 20) {
        errors.push('Mistral API key seems too short');
      }
      break;

    case 'ollama':
      // Ollama doesn't require API keys, but if provided, it should be a valid format
      if (apiKey.length > 0 && apiKey.length < 10) {
        errors.push('Ollama API key seems too short');
      }
      break;

    default:
      if (apiKey.length < 10) {
        errors.push('API key seems too short');
      }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common validation rules
 */
export const commonRules = {
  required: {
    test: (value: any) => value !== null && value !== undefined && value !== '',
    message: 'This field is required',
  },

  minLength: (min: number) => ({
    test: (value: any) => !value || (typeof value === 'string' && value.length >= min),
    message: `Minimum length is ${min} characters`,
  }),

  maxLength: (max: number) => ({
    test: (value: any) => !value || (typeof value === 'string' && value.length <= max),
    message: `Maximum length is ${max} characters`,
  }),

  minValue: (min: number) => ({
    test: (value: any) => !value || (typeof value === 'number' && value >= min),
    message: `Minimum value is ${min}`,
  }),

  maxValue: (max: number) => ({
    test: (value: any) => !value || (typeof value === 'number' && value <= max),
    message: `Maximum value is ${max}`,
  }),

  positive: {
    test: (value: any) => !value || (typeof value === 'number' && value > 0),
    message: 'Value must be positive',
  },

  integer: {
    test: (value: any) => !value || (typeof value === 'number' && Number.isInteger(value)),
    message: 'Value must be an integer',
  },
};

/**
 * Validates form data
 */
export function validateForm(formData: Record<string, any>, validationSchema: Record<string, ValidationRule[]>): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [field, rules] of Object.entries(validationSchema)) {
    const value = formData[field];

    if (typeof value === 'string') {
      results[field] = validateString(value, rules);
    } else if (typeof value === 'number') {
      results[field] = validateNumber(value, rules);
    } else {
      // Default to string validation
      results[field] = validateString(value, rules);
    }
  }

  return results;
}

/**
 * Checks if all validation results are valid
 */
export function isFormValid(validationResults: Record<string, ValidationResult>): boolean {
  return Object.values(validationResults).every(result => result.isValid);
}

/**
 * Gets all error messages from validation results
 */
export function getAllErrors(validationResults: Record<string, ValidationResult>): string[] {
  const errors: string[] = [];

  for (const result of Object.values(validationResults)) {
    errors.push(...result.errors);
  }

  return errors;
}