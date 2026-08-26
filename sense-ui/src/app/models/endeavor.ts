export type EndeavorStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type EndeavorPriority = 'low' | 'medium' | 'high';

export type EndeavorCategory =
  | 'personal'
  | 'business'
  | 'technology'
  | 'finance'
  | 'travel'
  | 'health'
  | 'legal'
  | 'other';

export const ENDEAVOR_STATUSES: { value: EndeavorStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const ENDEAVOR_PRIORITIES: { value: EndeavorPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const ENDEAVOR_CATEGORIES: { value: EndeavorCategory; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'travel', label: 'Travel' },
  { value: 'health', label: 'Health' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
];

/**
 * Keywords and newsMonitoringEnabled exist so a future background job can
 * periodically search for news related to this endeavor.
 */
export interface Endeavor {
  id: string;
  name: string;
  summary: string;
  description: string;
  category: EndeavorCategory;
  status: EndeavorStatus;
  priority: EndeavorPriority;
  keywords: string[];
  startDate: string | null;
  targetDate: string | null;
  newsMonitoringEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EndeavorInput = Omit<Endeavor, 'id' | 'createdAt' | 'updatedAt'>;
