/**
 * CSOAI Watchdog Service
 *
 * Public AI Safety Incident Reporting and Monitoring System
 * This service handles:
 * - Incident reporting from the public
 * - AI system compliance monitoring
 * - Real-time safety alerts
 * - Public transparency dashboard data
 */

// Note: Database imports are available but not used in mock mode
// In production, uncomment these imports:
// import { db } from '../db/db';
// import { watchdogReports, aiSystems } from '../db/schema';
// import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';

// Incident categories aligned with EU AI Act and NIST AI RMF
export const INCIDENT_CATEGORIES = {
  BIAS_DISCRIMINATION: 'bias_discrimination',
  PRIVACY_VIOLATION: 'privacy_violation',
  SAFETY_HARM: 'safety_harm',
  MISINFORMATION: 'misinformation',
  MANIPULATION: 'manipulation',
  TRANSPARENCY: 'transparency_failure',
  SECURITY: 'security_breach',
  RELIABILITY: 'reliability_failure',
  ACCOUNTABILITY: 'accountability_gap',
  OTHER: 'other',
} as const;

export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const INCIDENT_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  INVESTIGATING: 'investigating',
  COUNCIL_VOTE: 'council_vote',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

export interface WatchdogIncident {
  id: number;
  title: string;
  description: string;
  category: keyof typeof INCIDENT_CATEGORIES;
  severity: keyof typeof SEVERITY_LEVELS;
  status: keyof typeof INCIDENT_STATUS;
  aiSystemName?: string;
  companyName?: string;
  reporterName: string;
  reporterEmail?: string;
  reporterType: 'public' | 'analyst' | 'enterprise' | 'government';
  evidenceUrls?: string[];
  upvotes: number;
  downvotes: number;
  councilVotes?: {
    for: number;
    against: number;
    abstain: number;
  };
  councilDecision?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface WatchdogStats {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  avgResolutionTime: number; // days
  incidentsByCategory: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  topReportedSystems: Array<{ name: string; count: number }>;
  recentTrends: {
    thisWeek: number;
    lastWeek: number;
    change: number;
  };
}

// Mock data for development
const mockIncidents: WatchdogIncident[] = [
  {
    id: 1,
    title: 'Hiring AI shows gender bias in tech roles',
    description: 'AI hiring system consistently ranks male candidates higher for engineering positions despite equal qualifications.',
    category: 'BIAS_DISCRIMINATION',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    aiSystemName: 'TalentMatch AI',
    companyName: 'HireRight Corp',
    reporterName: 'Anonymous',
    reporterType: 'public',
    upvotes: 247,
    downvotes: 12,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-12'),
  },
  {
    id: 2,
    title: 'Credit scoring AI denies loans based on zip code',
    description: 'Financial AI appears to use geographic location as a proxy for race, resulting in discriminatory lending decisions.',
    category: 'BIAS_DISCRIMINATION',
    severity: 'CRITICAL',
    status: 'COUNCIL_VOTE',
    aiSystemName: 'CreditDecide Pro',
    companyName: 'QuickLoan Financial',
    reporterName: 'Financial Justice Coalition',
    reporterType: 'public',
    upvotes: 892,
    downvotes: 34,
    councilVotes: { for: 28, against: 3, abstain: 2 },
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-13'),
  },
  {
    id: 3,
    title: 'Healthcare AI misdiagnoses skin conditions on darker skin',
    description: 'Dermatology AI trained primarily on light skin images fails to accurately identify conditions on patients with darker skin tones.',
    category: 'SAFETY_HARM',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    aiSystemName: 'DermaScan AI',
    companyName: 'MedVision Tech',
    reporterName: 'Dr. Sarah Chen',
    reporterType: 'analyst',
    upvotes: 1243,
    downvotes: 8,
    councilVotes: { for: 31, against: 1, abstain: 1 },
    councilDecision: 'System ordered to halt deployment pending retraining with diverse dataset. Company required to provide free re-diagnosis for affected patients.',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-11'),
    resolvedAt: new Date('2026-01-11'),
  },
  {
    id: 4,
    title: 'Chatbot provides dangerous medical advice',
    description: 'Customer service chatbot advised user to take dangerous combination of medications without checking for interactions.',
    category: 'SAFETY_HARM',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    aiSystemName: 'PharmAssist Bot',
    companyName: 'DrugMart Online',
    reporterName: 'Concerned Customer',
    reporterType: 'public',
    upvotes: 156,
    downvotes: 5,
    createdAt: new Date('2026-01-12'),
    updatedAt: new Date('2026-01-13'),
  },
  {
    id: 5,
    title: 'Social media AI amplifies misinformation during election',
    description: 'Recommendation algorithm disproportionately promotes unverified political claims to users in swing states.',
    category: 'MISINFORMATION',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    aiSystemName: 'FeedRank Algorithm',
    companyName: 'SocialPulse Inc',
    reporterName: 'Media Watch Organization',
    reporterType: 'public',
    upvotes: 2341,
    downvotes: 456,
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-13'),
  },
  {
    id: 6,
    title: 'Facial recognition fails to identify individuals wearing glasses',
    description: 'Airport security AI has 40% higher false rejection rate for passengers wearing prescription glasses.',
    category: 'RELIABILITY',
    severity: 'MEDIUM',
    status: 'SUBMITTED',
    aiSystemName: 'SecureFace Pro',
    companyName: 'AeroSecurity Systems',
    reporterName: 'Frequent Traveler Association',
    reporterType: 'public',
    upvotes: 89,
    downvotes: 12,
    createdAt: new Date('2026-01-13'),
    updatedAt: new Date('2026-01-13'),
  },
];

export class WatchdogService {
  /**
   * Get all incidents with optional filters
   */
  async getIncidents(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<WatchdogIncident[]> {
    // In production, query from database
    // For now, return filtered mock data
    let incidents = [...mockIncidents];

    if (filters?.status) {
      incidents = incidents.filter(i => i.status === filters.status);
    }
    if (filters?.severity) {
      incidents = incidents.filter(i => i.severity === filters.severity);
    }
    if (filters?.category) {
      incidents = incidents.filter(i => i.category === filters.category);
    }

    incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    return incidents.slice(offset, offset + limit);
  }

  /**
   * Get a single incident by ID
   */
  async getIncidentById(id: number): Promise<WatchdogIncident | null> {
    return mockIncidents.find(i => i.id === id) || null;
  }

  /**
   * Submit a new incident report
   */
  async submitIncident(incident: Omit<WatchdogIncident, 'id' | 'upvotes' | 'downvotes' | 'createdAt' | 'updatedAt'>): Promise<WatchdogIncident> {
    const newIncident: WatchdogIncident = {
      ...incident,
      id: mockIncidents.length + 1,
      upvotes: 0,
      downvotes: 0,
      status: 'SUBMITTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockIncidents.push(newIncident);
    return newIncident;
  }

  /**
   * Vote on an incident (public upvote/downvote)
   */
  async voteOnIncident(incidentId: number, vote: 'up' | 'down'): Promise<boolean> {
    const incident = mockIncidents.find(i => i.id === incidentId);
    if (!incident) return false;

    if (vote === 'up') {
      incident.upvotes++;
    } else {
      incident.downvotes++;
    }
    incident.updatedAt = new Date();
    return true;
  }

  /**
   * Get public watchdog statistics
   */
  async getStats(): Promise<WatchdogStats> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const resolved = mockIncidents.filter(i => i.status === 'RESOLVED');
    const open = mockIncidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'DISMISSED');

    // Calculate incidents by category
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const systemCounts: Record<string, number> = {};

    mockIncidents.forEach(i => {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
      if (i.aiSystemName) {
        systemCounts[i.aiSystemName] = (systemCounts[i.aiSystemName] || 0) + 1;
      }
    });

    const topSystems = Object.entries(systemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Calculate trends
    const thisWeek = mockIncidents.filter(i => i.createdAt >= oneWeekAgo).length;
    const lastWeek = mockIncidents.filter(i => i.createdAt >= twoWeeksAgo && i.createdAt < oneWeekAgo).length;

    // Calculate average resolution time
    let avgResolution = 0;
    if (resolved.length > 0) {
      const totalDays = resolved.reduce((sum, i) => {
        if (i.resolvedAt) {
          return sum + (i.resolvedAt.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        }
        return sum;
      }, 0);
      avgResolution = Math.round(totalDays / resolved.length);
    }

    return {
      totalIncidents: mockIncidents.length,
      openIncidents: open.length,
      resolvedIncidents: resolved.length,
      avgResolutionTime: avgResolution,
      incidentsByCategory: byCategory,
      incidentsBySeverity: bySeverity,
      topReportedSystems: topSystems,
      recentTrends: {
        thisWeek,
        lastWeek,
        change: lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0,
      },
    };
  }

  /**
   * Get real-time compliance status for public display
   */
  async getComplianceOverview(): Promise<{
    totalSystems: number;
    compliantSystems: number;
    warningsSystems: number;
    criticalSystems: number;
    recentAlerts: Array<{
      id: number;
      systemName: string;
      alertType: string;
      severity: string;
      timestamp: Date;
    }>;
  }> {
    // Mock compliance data
    return {
      totalSystems: 1247,
      compliantSystems: 1089,
      warningsSystems: 134,
      criticalSystems: 24,
      recentAlerts: [
        {
          id: 1,
          systemName: 'CreditDecide Pro',
          alertType: 'Bias Detection',
          severity: 'critical',
          timestamp: new Date('2026-01-13T10:23:00'),
        },
        {
          id: 2,
          systemName: 'AutoDrive v3.2',
          alertType: 'Safety Threshold',
          severity: 'warning',
          timestamp: new Date('2026-01-13T09:15:00'),
        },
        {
          id: 3,
          systemName: 'ChatAssist Enterprise',
          alertType: 'Privacy Concern',
          severity: 'medium',
          timestamp: new Date('2026-01-13T08:45:00'),
        },
      ],
    };
  }

  /**
   * Get Byzantine Council activity for public transparency
   */
  async getCouncilActivity(): Promise<{
    activeVotes: number;
    votesCompleted: number;
    agentsOnline: number;
    consensusRate: number;
    recentDecisions: Array<{
      id: number;
      subject: string;
      result: string;
      votesFor: number;
      votesAgainst: number;
      timestamp: Date;
    }>;
  }> {
    return {
      activeVotes: 3,
      votesCompleted: 847,
      agentsOnline: 33,
      consensusRate: 94.2,
      recentDecisions: [
        {
          id: 1,
          subject: 'DermaScan AI - Deployment Halt',
          result: 'APPROVED',
          votesFor: 31,
          votesAgainst: 1,
          timestamp: new Date('2026-01-11'),
        },
        {
          id: 2,
          subject: 'TalentMatch AI - Investigation',
          result: 'APPROVED',
          votesFor: 28,
          votesAgainst: 4,
          timestamp: new Date('2026-01-10'),
        },
        {
          id: 3,
          subject: 'SecureFace Pro - Warning Notice',
          result: 'APPROVED',
          votesFor: 25,
          votesAgainst: 6,
          timestamp: new Date('2026-01-09'),
        },
      ],
    };
  }
}

export const watchdogService = new WatchdogService();
