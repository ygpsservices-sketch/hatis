import {
  Music,
  Drama,
  Palette,
  GraduationCap,
  UtensilsCrossed,
  Code,
  Briefcase,
  Mic,
  Camera,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'Music', label: 'Music', icon: Music },
  { value: 'Comedy', label: 'Comedy', icon: Drama },
  { value: 'Art', label: 'Art', icon: Palette },
  { value: 'Education', label: 'Education', icon: GraduationCap },
  { value: 'Food', label: 'Food', icon: UtensilsCrossed },
  { value: 'Tech', label: 'Tech', icon: Code },
  { value: 'Business', label: 'Business', icon: Briefcase },
  { value: 'Podcast', label: 'Podcast', icon: Mic },
  { value: 'Photography', label: 'Photography', icon: Camera },
  { value: 'Sports', label: 'Sports', icon: Trophy },
];

export const LOCATIONS = [
  'Haiti',
  'United States',
  'Canada',
  'France',
  'Dominican Republic',
  'Other diaspora',
];

export const LANGUAGES = ['Kreyòl', 'French', 'English', 'Spanish'];

export interface PaymentMethodInfo {
  type: string;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

export const PAYMENT_METHODS: Record<string, PaymentMethodInfo> = {
  MonCash: {
    type: 'MonCash',
    label: 'MonCash',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Mobile payment popular in Haiti',
  },
  NatCash: {
    type: 'NatCash',
    label: 'NatCash',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'National Cash mobile transfer',
  },
  PayPal: {
    type: 'PayPal',
    label: 'PayPal',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    description: 'Pay online with PayPal',
  },
  'Cash App': {
    type: 'Cash App',
    label: 'Cash App',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    description: 'Send money with Cash App',
  },
  Zelle: {
    type: 'Zelle',
    label: 'Zelle',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Send through your bank app',
  },
  Payoneer: {
    type: 'Payoneer',
    label: 'Payoneer',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    description: 'International payment platform',
  },
  'Bank transfer': {
    type: 'Bank transfer',
    label: 'Bank Transfer',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    description: 'Direct bank transfer',
  },
};

export const CATEGORY_LIST = CATEGORIES.map((c) => c.value);
