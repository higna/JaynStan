export const PROVIDER_CATEGORIES = [
  'software-development',
  'graphic-design',
  'artwork-painting',
  'architecture',
] as const;

export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number];
export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl: string | null;
  phone: string | null;
  role: UserRole;
  emailVerified: boolean;
}
