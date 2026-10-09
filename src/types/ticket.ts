export type UserType = 'Student Pro' | 'Franchise Hub';

export type MembershipTier = 'Diamond Elite' | 'Silver Pass' | 'Other / Not Specified';

export type ProductEcosystem = 
  | 'Chakravyuh CRM' 
  | 'Digital Azadi Hub' 
  | 'WordPress & Hosting' 
  | 'Other';

export type TicketStatus = 
  | 'New' 
  | 'In Progress' 
  | 'Waiting for User' 
  | 'Resolved';

export type TicketPriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export interface InternalNote {
  id: string;
  author: string;
  content: string;
  createdAt: string; // ISO string
}

export interface TicketAuditEvent {
  id: string;
  action: string;
  timestamp: string; // ISO string
  details?: string;
  performedBy: string;
}

export interface Ticket {
  id: string;
  ticketId: string; // e.g. DA-2026-8941
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string; // Validated 10 digits
  userType: UserType;
  membershipTier: MembershipTier;
  ecosystem: ProductEcosystem;
  category: string;
  subject: string;
  description: string;
  websiteUrl?: string;
  
  status: TicketStatus;
  priority: TicketPriority;
  assignedAgent?: string;
  
  // Authoritative Timestamps in UTC
  createdAt: string;
  updatedAt: string;
  supportStartedAt?: string;
  supportEndedAt?: string;
  
  // Numerical duration counters
  activeDurationSeconds: number;
  resolutionDurationSeconds?: number;
  
  resolutionNotes?: string;
  internalNotes?: InternalNote[];
  auditHistory?: TicketAuditEvent[];
  
  // Google Sheets sync tracking
  syncedToSheets?: boolean;
  lastSyncedAt?: string;
  syncError?: string;
}

export interface TicketFormData {
  fullName: string;
  email: string;
  mobile: string;
  userType: UserType;
  membershipTier: MembershipTier;
  ecosystem: ProductEcosystem;
  category: string;
  websiteUrl?: string;
  subject: string;
  description: string;
}
