export type ProspectStatus = "NEW" | "CONTACTED" | "OPENED" | "REPLIED" | "CONVERTED" | "UNSUBSCRIBED";
export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
export type EmailStatus = "PENDING" | "SENT" | "FAILED" | "OPENED" | "REPLIED" | "BOUNCED";

export interface Prospect {
  id: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  niche: string;
  city: string;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  status: ProspectStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  niche: string;
  city: string;
  subject: string;
  template: string;
  status: CampaignStatus;
  dailyLimit: number;
  sentCount: number;
  openCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id: string;
  userId: string;
  prospectId: string;
  campaignId?: string | null;
  subject: string;
  body: string;
  status: EmailStatus;
  messageId?: string | null;
  openedAt?: Date | null;
  repliedAt?: Date | null;
  sentAt?: Date | null;
  createdAt: Date;
}

export interface DashboardStats {
  totalProspects: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  activeCampaigns: number;
  todaySent: number;
}

export interface ScrapedBusiness {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  niche: string;
  city: string;
}
