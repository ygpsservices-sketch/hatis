export const HATIS_DOMAIN = 'hatis.com/creator/';

export const RESERVED_WORDS = [
  'discover',
  'categories',
  'claim',
  'login',
  'signup',
  'admin',
  'terms',
  'privacy',
  'creator',
  'dashboard',
  'settings',
  'api',
  'www',
  'hatis',
  'support',
  'help',
  'about',
  'new',
];

export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export const REPORT_REASONS = [
  { value: 'wrong_number', label: 'Wrong number or handle' },
  { value: 'impersonation', label: 'Impersonation — this is not the real creator' },
  { value: 'scam', label: 'Scam or fraudulent request' },
  { value: 'other', label: 'Other problem' },
];
