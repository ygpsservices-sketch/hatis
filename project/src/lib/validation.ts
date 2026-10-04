export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSupportMethod(methodType: string, displayValue: string, linkUrl?: string): ValidationResult {
  const value = displayValue.trim();
  const link = (linkUrl || '').trim();

  if (!value) return { valid: false, error: 'This field is required.' };

  switch (methodType) {
    case 'PayPal': {
      const combined = (link || value).toLowerCase();
      if (!combined.includes('paypal.me') && !combined.includes('paypal.com')) {
        return { valid: false, error: 'PayPal must be a paypal.me or paypal.com link.' };
      }
      return { valid: true };
    }

    case 'Cash App': {
      if (!value.startsWith('$')) {
        return { valid: false, error: 'Cash App handle must start with $.' };
      }
      if (value.length < 2) {
        return { valid: false, error: 'Cash App handle is too short.' };
      }
      return { valid: true };
    }

    case 'Zelle': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        return { valid: false, error: 'Zelle must be an email or phone number.' };
      }
      return { valid: true };
    }

    case 'MonCash':
    case 'NatCash': {
      const cleaned = value.replace(/[\s-]/g, '');
      if (!cleaned.startsWith('+509') && !cleaned.startsWith('509')) {
        return { valid: false, error: 'Must be a Haitian phone number starting with +509.' };
      }
      const digits = cleaned.replace(/^\+?509/, '');
      if (digits.length !== 8 || !/^\d{8}$/.test(digits)) {
        return { valid: false, error: 'Haitian numbers must have 8 digits after +509.' };
      }
      return { valid: true };
    }

    case 'Payoneer': {
      try {
        const url = new URL(link || value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return { valid: false, error: 'Payoneer must be a valid link.' };
        }
        return { valid: true };
      } catch {
        return { valid: false, error: 'Payoneer must be a valid link.' };
      }
    }

    case 'Bank transfer': {
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

export function normalizeHaitianPhone(value: string): string {
  const cleaned = value.replace(/[\s-]/g, '');
  if (cleaned.startsWith('509') && !cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return cleaned;
}

export function formatDisplayValue(methodType: string, value: string): string {
  if (methodType === 'MonCash' || methodType === 'NatCash') {
    return normalizeHaitianPhone(value);
  }
  return value.trim();
}
