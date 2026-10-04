export interface Creator {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  tagline: string | null;
  bio: string | null;
  category: string;
  categories: string[] | null;
  location: string | null;
  language: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  featured: boolean;
  verified: boolean;
  profile_complete: number;
  onboarding_complete: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  creator_id: string;
  platform: string;
  url: string;
  label: string | null;
  created_at: string;
}

export interface SupportMethod {
  id: string;
  creator_id: string;
  method_type: string;
  display_value: string;
  link_url: string | null;
  instructions: string | null;
  hidden: boolean;
  created_at: string;
}

export interface SupportClick {
  id: string;
  creator_id: string;
  method_type: string;
  clicked_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'creator' | 'supporter';
  is_admin: boolean;
  created_at: string;
}

export interface ClaimRequest {
  id: string;
  creator_id: string;
  user_id: string;
  message: string | null;
  proof_url: string | null;
  claim_code: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  creator_id: string;
  support_method_id: string | null;
  reason: 'wrong_number' | 'impersonation' | 'scam' | 'other';
  details: string | null;
  reporter_contact: string | null;
  status: 'open' | 'resolved';
  reporter_ip: string | null;
  created_at: string;
}

export interface CreatorWithRelations extends Creator {
  social_links: SocialLink[];
  support_methods: SupportMethod[];
  support_click_count?: number;
}
