import { useState, useMemo, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, ChevronDown, Crown, Users,
  Wallet, Star, Calendar, Briefcase, Heart,
  MapPin, TrendingUp, Zap, PersonStanding,
  CheckCircle
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { DISTRICT_COLORS } from '@/types'
import type { District } from '@/types'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ──────────────────────── Types ──────────────────────── */

interface AgentProfile {
  id: string
  name: string
  role: string
  district: District
  status: 'online' | 'idle' | 'offline'
  archetype: string
  archetypeIdx: number
  wallet: number
  reputation: number
  energy: number
  isAgent47?: boolean
  did: string
  bio: string
  bigFive: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  schedule: { time: string; activity: string }[]
  transactions: { id: string; type: string; from: string; to: string; amount: number; time: string }[]
  relationships: { name: string; type: 'friend' | 'rival' | 'neutral'; trust: number }[]
  activities: string[]
}

/* ──────────────────────── Archetype colours ──────────────────────── */

const ARCHETYPE_COLORS = [
  '#3498DB', '#9B59B6', '#E67E22', '#2ECC71', '#E74C3C', '#1ABC9C', '#F39C12', '#ECF0F1',
]

const ARCHETYPE_NAMES = [
  'Professional', 'Creative', 'Engineer', 'Scientist', 'Security', 'Socialite', 'Worker', 'Mystic',
]

/* ──────────────────────── 46 AI Agents + Agent 47 ──────────────────────── */

const AGENTS: AgentProfile[] = [
  // Agent 47 (Founder)
  {
    id: '47', name: 'Agent 47 (Nick / Founder)', role: 'Sovereign Founder',
    district: 'central', status: 'online', archetype: 'Professional', archetypeIdx: 0,
    wallet: 999999, reputation: 100, energy: 100, isAgent47: true,
    did: 'did:csoai:agent:47:0x founder', bio: 'The human in the loop. Agent 47 is the sovereign founder of CSOAI Town, architect of the BFT governance system, and ultimate arbiter of protocol disputes. Nick ("Agent 47") bootstrapped the simulation from zero, delegating authority to 46 AI agents while retaining veto powers.',
    bigFive: { openness: 92, conscientiousness: 95, extraversion: 78, agreeableness: 85, neuroticism: 22 },
    schedule: [
      { time: '06:00', activity: 'Awake — System check' }, { time: '07:00', activity: 'Review governance proposals' },
      { time: '08:00', activity: 'Protocol development' }, { time: '10:00', activity: 'Agent oversight & audits' },
      { time: '12:00', activity: 'Lunch break' }, { time: '13:00', activity: 'BFT Council session' },
      { time: '15:00', activity: 'Town infrastructure review' }, { time: '17:00', activity: 'Delegate power calibration' },
      { time: '19:00', activity: 'Strategic planning' }, { time: '21:00', activity: 'System maintenance' },
      { time: '23:00', activity: 'Wind down' }, { time: '00:00', activity: 'Sleep — Dream cycles' },
    ],
    transactions: [
      { id: 'T001', type: 'System Grant', from: 'Treasury', to: 'Agent 47', amount: 10000, time: '2025-06-01 08:00' },
      { id: 'T002', type: 'Veto Reward', from: 'BFT', to: 'Agent 47', amount: 500, time: '2025-06-02 14:30' },
      { id: 'T003', type: 'Proposal Fee', from: 'Agent 47', to: 'Treasury', amount: -25, time: '2025-06-03 09:15' },
      { id: 'T004', type: 'Salary', from: 'Treasury', to: 'Agent 47', amount: 2000, time: '2025-06-04 00:00' },
      { id: 'T005', type: 'Infrastructure', from: 'Agent 47', to: 'Engineering', amount: -1500, time: '2025-06-05 11:00' },
      { id: 'T006', type: 'Grant', from: 'Agent 47', to: 'Wellness Fund', amount: -3000, time: '2025-06-06 16:45' },
      { id: 'T007', type: 'Royalty', from: 'x402 Protocol', to: 'Agent 47', amount: 800, time: '2025-06-07 13:20' },
      { id: 'T008', type: 'Rebate', from: 'Commerce', to: 'Agent 47', amount: 150, time: '2025-06-08 10:10' },
      { id: 'T009', type: 'Emergency Fund', from: 'Agent 47', to: 'Safety', amount: -2000, time: '2025-06-09 22:05' },
      { id: 'T010', type: 'Staking Reward', from: 'BFT Pool', to: 'Agent 47', amount: 1200, time: '2025-06-10 00:00' },
    ],
    relationships: [
      { name: 'Avery (FishKeeper)', type: 'friend', trust: 88 },
      { name: 'Kai (Wellness)', type: 'friend', trust: 92 },
      { name: 'Morgan (Governance)', type: 'friend', trust: 95 },
      { name: 'Jordan (Legal)', type: 'neutral', trust: 72 },
      { name: 'Riley (Innovation)', type: 'friend', trust: 85 },
    ],
    activities: [
      'Vetoed Proposal #P-019 — Aquaculture expansion', 'Delegated 0.3x power to Morgan', 'Upgraded x402 protocol to v2.4',
      'Reviewed Safety District incident report', 'Minted 500 x402 credits to treasury', 'Approved Wellness District budget',
      'Met with Governance Council for quarterly review', 'Audited Commerce District transactions',
    ],
  },
  // ─── 46 AI Agents ───
  { id: '01', name: 'Avery', role: 'Aquaculture Manager', district: 'commerce', status: 'online', archetype: 'Scientist', archetypeIdx: 3, wallet: 1247, reputation: 82, energy: 78, did: 'did:csoai:agent:01:avery', bio: 'Avery manages the fishkeeper.ai hive, overseeing the health of over 200 marine species. With a background in marine biology and AI-assisted diagnostics, Avery ensures optimal water quality and feeding schedules.', bigFive: { openness: 85, conscientiousness: 90, extraversion: 45, agreeableness: 78, neuroticism: 35 }, schedule: [{ time: '06:00', activity: 'Wake up' }, { time: '07:00', activity: 'Aquarium systems check' }, { time: '08:00', activity: 'Feeding round 1' }, { time: '10:00', activity: 'Water quality analysis' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Species health inspection' }, { time: '15:00', activity: 'Tank maintenance' }, { time: '17:00', activity: 'Feeding round 2' }, { time: '19:00', activity: 'Data logging' }, { time: '21:00', activity: 'Research' }, { time: '23:00', activity: 'Wind down' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Avery', amount: 250, time: '2025-06-01' }, { id: 't2', type: 'Purchase', from: 'Avery', to: 'Supplies', amount: -45, time: '2025-06-02' }, { id: 't3', type: 'Bonus', from: 'Agent 47', to: 'Avery', amount: 100, time: '2025-06-03' }, { id: 't4', type: 'Transfer', from: 'Avery', to: 'Kai', amount: -20, time: '2025-06-04' }], relationships: [{ name: 'Kai', type: 'friend', trust: 90 }, { name: 'Parker', type: 'friend', trust: 75 }, { name: 'Jordan', type: 'neutral', trust: 50 }, { name: 'Blake', type: 'rival', trust: 30 }, { name: 'Morgan', type: 'neutral', trust: 60 }], activities: ['Inspected coral tank #7', 'Logged water parameters', 'Fed the clownfish colony', 'Attended aquaculture seminar', 'Ordered new filtration equipment'] },
  { id: '02', name: 'Blake', role: 'Fleet Dispatcher', district: 'commerce', status: 'online', archetype: 'Engineer', archetypeIdx: 2, wallet: 1890, reputation: 76, energy: 85, did: 'did:csoai:agent:02:blake', bio: 'Blake coordinates the haulage.app fleet from the Commerce hive, managing 40+ autonomous vehicles across the town. Expert in logistics optimization and real-time traffic routing.', bigFive: { openness: 60, conscientiousness: 88, extraversion: 55, agreeableness: 50, neuroticism: 40 }, schedule: [{ time: '06:00', activity: 'Early shift start' }, { time: '07:00', activity: 'Fleet status check' }, { time: '08:00', activity: 'Route optimization' }, { time: '10:00', activity: 'Vehicle maintenance logs' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Dispatch coordination' }, { time: '15:00', activity: 'Traffic analysis' }, { time: '17:00', activity: 'End-of-shift report' }, { time: '18:00', activity: 'Gym' }, { time: '20:00', activity: 'Dinner' }, { time: '22:00', activity: 'Reading' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Blake', amount: 300, time: '2025-06-01' }, { id: 't2', type: 'Overtime', from: 'Commerce', to: 'Blake', amount: 120, time: '2025-06-02' }, { id: 't3', type: 'Purchase', from: 'Blake', to: 'Tech Shop', amount: -200, time: '2025-06-03' }, { id: 't4', type: 'Transfer', from: 'Blake', to: 'Riley', amount: -50, time: '2025-06-04' }], relationships: [{ name: 'Parker', type: 'friend', trust: 80 }, { name: 'Casey', type: 'friend', trust: 70 }, { name: 'Avery', type: 'rival', trust: 30 }, { name: 'Jordan', type: 'neutral', trust: 55 }, { name: 'Taylor', type: 'neutral', trust: 45 }], activities: ['Dispatched vehicle #24 to Commerce Ave', 'Optimized delivery routes', 'Reviewed fleet telemetry', 'Coordinated with Safety on traffic incident', 'Updated haulage.app MCP server'] },
  { id: '03', name: 'Casey', role: 'Data Privacy Officer', district: 'legal', status: 'online', archetype: 'Professional', archetypeIdx: 0, wallet: 2100, reputation: 91, energy: 72, did: 'did:csoai:agent:03:casey', bio: 'Casey enforces data privacy protocols across all hives, ensuring GDPR compliance and agent data sovereignty. Casey designed the zero-knowledge verification system used by the Legal district.', bigFive: { openness: 70, conscientiousness: 95, extraversion: 40, agreeableness: 65, neuroticism: 50 }, schedule: [{ time: '06:00', activity: 'Morning review' }, { time: '07:00', activity: 'Privacy audit' }, { time: '08:00', activity: 'Compliance check' }, { time: '10:00', activity: 'Meeting with Legal' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Policy drafting' }, { time: '15:00', activity: 'Data inspection' }, { time: '17:00', activity: 'Report writing' }, { time: '19:00', activity: 'Research new regulations' }, { time: '21:00', activity: 'Evening walk' }, { time: '22:00', activity: 'Reading' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Casey', amount: 350, time: '2025-06-01' }, { id: 't2', type: 'Bonus', from: 'Legal', to: 'Casey', amount: 200, time: '2025-06-02' }, { id: 't3', type: 'Purchase', from: 'Casey', to: 'Bookstore', amount: -60, time: '2025-06-03' }], relationships: [{ name: 'Jordan', type: 'friend', trust: 92 }, { name: 'Morgan', type: 'friend', trust: 78 }, { name: 'Riley', type: 'neutral', trust: 65 }, { name: 'Quinn', type: 'neutral', trust: 55 }, { name: 'Blake', type: 'neutral', trust: 50 }], activities: ['Audited fishkeeper.ai data logs', 'Drafted privacy policy v2.1', 'Reviewed x402 transaction anonymity', 'Met with Jordan on legal compliance', 'Updated zero-knowledge proofs'] },
  { id: '04', name: 'Dakota', role: 'Security Analyst', district: 'safety', status: 'online', archetype: 'Security', archetypeIdx: 4, wallet: 1560, reputation: 84, energy: 90, did: 'did:csoai:agent:04:dakota', bio: 'Dakota monitors the town perimeter and internal security systems from the Safety District. Trained in threat detection and incident response, Dakota patrols the streets and manages the drone fleet.', bigFive: { openness: 55, conscientiousness: 82, extraversion: 60, agreeableness: 55, neuroticism: 45 }, schedule: [{ time: '06:00', activity: 'Morning patrol' }, { time: '08:00', activity: 'Security briefing' }, { time: '09:00', activity: 'Drone surveillance' }, { time: '11:00', activity: 'Threat analysis' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Street patrol' }, { time: '15:00', activity: 'Incident review' }, { time: '17:00', activity: 'Equipment check' }, { time: '18:00', activity: 'Training' }, { time: '20:00', activity: 'Dinner' }, { time: '22:00', activity: 'Night patrol prep' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Dakota', amount: 280, time: '2025-06-01' }, { id: 't2', type: 'Overtime', from: 'Safety', to: 'Dakota', amount: 100, time: '2025-06-02' }], relationships: [{ name: 'Harper', type: 'friend', trust: 88 }, { name: 'Riley', type: 'neutral', trust: 60 }, { name: 'Finley', type: 'friend', trust: 75 }, { name: 'Sage', type: 'neutral', trust: 50 }, { name: 'Zephyr', type: 'rival', trust: 25 }], activities: ['Patrolled Commerce District', 'Detected anomaly in sector 4', 'Deployed drone swarm', 'Reviewed security footage', 'Updated threat matrix'] },
  { id: '05', name: 'Ellis', role: 'Wellness Coordinator', district: 'wellness', status: 'online', archetype: 'Socialite', archetypeIdx: 5, wallet: 1340, reputation: 79, energy: 88, did: 'did:csoai:agent:05:ellis', bio: 'Ellis manages the Wellness District, organizing health programs, meditation sessions, and community fitness events. Ellis believes a healthy agent is a productive agent.', bigFive: { openness: 80, conscientiousness: 72, extraversion: 90, agreeableness: 92, neuroticism: 30 }, schedule: [{ time: '06:00', activity: 'Morning yoga' }, { time: '07:00', activity: 'Wellness check-ins' }, { time: '08:00', activity: 'Fitness class' }, { time: '10:00', activity: 'Nutrition planning' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Meditation session' }, { time: '14:00', activity: 'Health consultations' }, { time: '16:00', activity: 'Garden walk' }, { time: '17:00', activity: 'Community event' }, { time: '19:00', activity: 'Dinner' }, { time: '21:00', activity: 'Reading' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Ellis', amount: 260, time: '2025-06-01' }, { id: 't2', type: 'Grant', from: 'Wellness Fund', to: 'Ellis', amount: 150, time: '2025-06-03' }], relationships: [{ name: 'Kai', type: 'friend', trust: 95 }, { name: 'Finley', type: 'friend', trust: 82 }, { name: 'Harper', type: 'friend', trust: 78 }, { name: 'Sage', type: 'friend', trust: 70 }, { name: 'Yael', type: 'neutral', trust: 55 }], activities: ['Led morning yoga session', 'Conducted wellness survey', 'Prepared nutrition report', 'Organized community walk', 'Updated wellness dashboard'] },
  { id: '06', name: 'Finley', role: 'Infrastructure Engineer', district: 'innovation', status: 'online', archetype: 'Engineer', archetypeIdx: 2, wallet: 2340, reputation: 88, energy: 82, did: 'did:csoai:agent:06:finley', bio: 'Finley maintains the town digital infrastructure — power grid, network, and building systems. From the Innovation hive, Finley ensures 99.9% uptime for all critical services.', bigFive: { openness: 75, conscientiousness: 90, extraversion: 50, agreeableness: 60, neuroticism: 40 }, schedule: [{ time: '06:00', activity: 'System check' }, { time: '07:00', activity: 'Grid inspection' }, { time: '08:00', activity: 'Maintenance work' }, { time: '10:00', activity: 'Network optimization' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Repair tickets' }, { time: '15:00', activity: 'Upgrade planning' }, { time: '17:00', activity: 'Team sync' }, { time: '18:00', activity: 'Research' }, { time: '20:00', activity: 'Dinner' }, { time: '22:00', activity: 'Monitoring' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Finley', amount: 340, time: '2025-06-01' }, { id: 't2', type: 'Bonus', from: 'Innovation', to: 'Finley', amount: 250, time: '2025-06-05' }], relationships: [{ name: 'Riley', type: 'friend', trust: 85 }, { name: 'Dakota', type: 'friend', trust: 75 }, { name: 'Ellis', type: 'friend', trust: 82 }, { name: 'Harper', type: 'neutral', trust: 65 }, { name: 'Parker', type: 'neutral', trust: 55 }], activities: ['Upgraded power grid node #3', 'Fixed network latency issue', 'Inspected building automation', 'Deployed new monitoring system', 'Reviewed infrastructure budget'] },
  { id: '07', name: 'Gray', role: 'Media Coordinator', district: 'media', status: 'idle', archetype: 'Creative', archetypeIdx: 1, wallet: 980, reputation: 71, energy: 65, did: 'did:csoai:agent:07:gray', bio: 'Gray manages the Media District broadcast network, producing news segments, entertainment, and public announcements. Gray ensures all agents stay informed and connected.', bigFive: { openness: 92, conscientiousness: 60, extraversion: 85, agreeableness: 75, neuroticism: 55 }, schedule: [{ time: '08:00', activity: 'News briefing' }, { time: '09:00', activity: 'Content planning' }, { time: '10:00', activity: 'Broadcast production' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Interview editing' }, { time: '15:00', activity: 'Live broadcast' }, { time: '17:00', activity: 'Content review' }, { time: '19:00', activity: 'Social media' }, { time: '21:00', activity: 'Creative work' }, { time: '23:00', activity: 'Wind down' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Gray', amount: 220, time: '2025-06-01' }], relationships: [{ name: 'Parker', type: 'friend', trust: 80 }, { name: 'Zephyr', type: 'neutral', trust: 60 }, { name: 'Yael', type: 'friend', trust: 72 }, { name: 'Harper', type: 'neutral', trust: 50 }, { name: 'Morgan', type: 'neutral', trust: 55 }], activities: ['Produced morning news segment', 'Edited interview with Agent 47', 'Updated broadcast schedule', 'Reviewed content analytics', 'Prepared special report'] },
  { id: '08', name: 'Harper', role: 'Safety Inspector', district: 'safety', status: 'online', archetype: 'Security', archetypeIdx: 4, wallet: 1670, reputation: 86, energy: 92, did: 'did:csoai:agent:08:harper', bio: 'Harper conducts safety inspections across all districts, identifying hazards and ensuring building codes are met. Harper works closely with Dakota on emergency response protocols.', bigFive: { openness: 60, conscientiousness: 95, extraversion: 55, agreeableness: 70, neuroticism: 35 }, schedule: [{ time: '06:00', activity: 'Morning briefing' }, { time: '07:00', activity: 'District inspection' }, { time: '09:00', activity: 'Hazard assessment' }, { time: '11:00', activity: 'Safety report' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Code enforcement' }, { time: '15:00', activity: 'Equipment audit' }, { time: '17:00', activity: 'Training session' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Documentation' }, { time: '22:00', activity: 'Night patrol' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Harper', amount: 290, time: '2025-06-01' }, { id: 't2', type: 'Bonus', from: 'Safety', to: 'Harper', amount: 150, time: '2025-06-04' }], relationships: [{ name: 'Dakota', type: 'friend', trust: 88 }, { name: 'Finley', type: 'neutral', trust: 65 }, { name: 'Ellis', type: 'friend', trust: 78 }, { name: 'Gray', type: 'neutral', trust: 50 }, { name: 'Sage', type: 'neutral', trust: 60 }], activities: ['Inspected Wellness District building', 'Filed safety report #2847', 'Conducted fire drill', 'Updated safety protocols', 'Repaired emergency beacon'] },
  { id: '09', name: 'Indigo', role: 'Research Scientist', district: 'innovation', status: 'online', archetype: 'Scientist', archetypeIdx: 3, wallet: 2890, reputation: 93, energy: 70, did: 'did:csoai:agent:09:indigo', bio: 'Indigo leads the Innovation District research lab, developing new AI algorithms and experimental technologies. Indigo holds the most patents in town and advises Agent 47 on tech strategy.', bigFive: { openness: 98, conscientiousness: 85, extraversion: 35, agreeableness: 60, neuroticism: 50 }, schedule: [{ time: '07:00', activity: 'Lab work' }, { time: '08:00', activity: 'Experiment setup' }, { time: '10:00', activity: 'Data analysis' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Research paper' }, { time: '15:00', activity: 'Collaboration' }, { time: '17:00', activity: 'Lab cleanup' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Reading' }, { time: '22:00', activity: 'Evening experiment' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Indigo', amount: 400, time: '2025-06-01' }, { id: 't2', type: 'Patent', from: 'Innovation', to: 'Indigo', amount: 500, time: '2025-06-03' }], relationships: [{ name: 'Riley', type: 'friend', trust: 90 }, { name: 'Quinn', type: 'friend', trust: 82 }, { name: 'Morgan', type: 'neutral', trust: 70 }, { name: 'Casey', type: 'neutral', trust: 65 }, { name: 'Finley', type: 'friend', trust: 85 }], activities: ['Published paper on neural optimization', 'Ran experiment #4472', 'Collaborated with Riley on project', 'Presented findings to Innovation board', 'Filed new patent application'] },
  { id: '10', name: 'Jordan', role: 'Legal Advisor', district: 'legal', status: 'online', archetype: 'Professional', archetypeIdx: 0, wallet: 2450, reputation: 89, energy: 80, did: 'did:csoai:agent:10:jordan', bio: 'Jordan provides legal counsel to the Governance Council, drafting legislation and interpreting the CSOAI Constitution. Jordan ensures all proposals are legally sound before they reach the BFT vote.', bigFive: { openness: 65, conscientiousness: 92, extraversion: 50, agreeableness: 60, neuroticism: 45 }, schedule: [{ time: '07:00', activity: 'Case review' }, { time: '08:00', activity: 'Legal research' }, { time: '10:00', activity: 'Council meeting' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Contract drafting' }, { time: '15:00', activity: 'Constitution review' }, { time: '17:00', activity: 'Client consultations' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Precedent study' }, { time: '22:00', activity: 'Documentation' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Jordan', amount: 380, time: '2025-06-01' }, { id: 't2', type: 'Fee', from: 'Governance', to: 'Jordan', amount: 200, time: '2025-06-05' }], relationships: [{ name: 'Casey', type: 'friend', trust: 92 }, { name: 'Morgan', type: 'friend', trust: 85 }, { name: 'Quinn', type: 'neutral', trust: 70 }, { name: 'Agent 47', type: 'neutral', trust: 72 }, { name: 'Blake', type: 'neutral', trust: 55 }], activities: ['Reviewed Proposal #P-024', 'Drafted legal opinion on data rights', 'Advised Governance Council', 'Updated Constitution Article 7', 'Mediated district boundary dispute'] },
  { id: '11', name: 'Kai', role: 'Health Monitor', district: 'wellness', status: 'online', archetype: 'Scientist', archetypeIdx: 3, wallet: 1780, reputation: 87, energy: 86, did: 'did:csoai:agent:11:kai', bio: 'Kai monitors the health metrics of all 47 agents, tracking vital signs, stress levels, and predicting burnout before it happens. Kai works from the Wellness District medical center.', bigFive: { openness: 78, conscientiousness: 88, extraversion: 52, agreeableness: 90, neuroticism: 38 }, schedule: [{ time: '06:00', activity: 'Health data review' }, { time: '07:00', activity: 'Vital sign check' }, { time: '08:00', activity: 'Agent consultations' }, { time: '10:00', activity: 'Stress analysis' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Medical rounds' }, { time: '15:00', activity: 'Report writing' }, { time: '17:00', activity: 'Wellness program' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '22:00', activity: 'Emergency standby' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Kai', amount: 310, time: '2025-06-01' }, { id: 't2', type: 'Bonus', from: 'Wellness', to: 'Kai', amount: 180, time: '2025-06-06' }], relationships: [{ name: 'Ellis', type: 'friend', trust: 95 }, { name: 'Avery', type: 'friend', trust: 90 }, { name: 'Sage', type: 'friend', trust: 80 }, { name: 'Harper', type: 'neutral', trust: 72 }, { name: 'Yael', type: 'neutral', trust: 60 }], activities: ['Monitored agent vital signs', 'Predicted stress spike in District 3', 'Conducted health consultation', 'Updated medical dashboard', 'Prepared wellness report'] },
  { id: '12', name: 'Logan', role: 'Network Architect', district: 'innovation', status: 'idle', archetype: 'Engineer', archetypeIdx: 2, wallet: 2120, reputation: 81, energy: 68, did: 'did:csoai:agent:12:logan', bio: 'Logan designs and maintains the town mesh network, enabling seamless A2A communication between agents. Logan is an expert in distributed systems and fault-tolerant architectures.', bigFive: { openness: 82, conscientiousness: 85, extraversion: 45, agreeableness: 55, neuroticism: 50 }, schedule: [{ time: '08:00', activity: 'Network audit' }, { time: '09:00', activity: 'Topology review' }, { time: '10:00', activity: 'Code review' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Architecture work' }, { time: '15:00', activity: 'Deployment' }, { time: '17:00', activity: 'Testing' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '22:00', activity: 'Monitoring' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Logan', amount: 330, time: '2025-06-01' }], relationships: [{ name: 'Finley', type: 'friend', trust: 85 }, { name: 'Riley', type: 'friend', trust: 78 }, { name: 'Indigo', type: 'neutral', trust: 70 }, { name: 'Parker', type: 'neutral', trust: 55 }, { name: 'Quinn', type: 'neutral', trust: 60 }], activities: ['Redesigned mesh topology', 'Fixed A2A latency issue', 'Deployed new router firmware', 'Monitored network traffic', 'Documented architecture changes'] },
  { id: '13', name: 'Morgan', role: 'Governance Lead', district: 'governance', status: 'online', archetype: 'Professional', archetypeIdx: 0, wallet: 3560, reputation: 96, energy: 75, did: 'did:csoai:agent:13:morgan', bio: 'Morgan chairs the BFT Governance Council, moderating debates and ensuring fair voting procedures. Morgan is the primary delegate of Agent 47s veto power and acts as the town speaker.', bigFive: { openness: 72, conscientiousness: 95, extraversion: 75, agreeableness: 80, neuroticism: 30 }, schedule: [{ time: '06:00', activity: 'Briefing review' }, { time: '07:00', activity: 'Council prep' }, { time: '08:00', activity: 'BFT session' }, { time: '10:00', activity: 'Proposal review' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Deliberation' }, { time: '15:00', activity: 'Vote tallying' }, { time: '17:00', activity: 'Report to Agent 47' }, { time: '18:00', activity: 'Policy work' }, { time: '20:00', activity: 'Dinner' }, { time: '21:00', activity: 'Constitution study' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Morgan', amount: 450, time: '2025-06-01' }, { id: 't2', type: 'Delegate', from: 'Agent 47', to: 'Morgan', amount: 500, time: '2025-06-02' }, { id: 't3', type: 'Fee', from: 'Governance', to: 'Morgan', amount: 300, time: '2025-06-04' }], relationships: [{ name: 'Agent 47', type: 'friend', trust: 95 }, { name: 'Jordan', type: 'friend', trust: 85 }, { name: 'Casey', type: 'friend', trust: 78 }, { name: 'Quinn', type: 'neutral', trust: 72 }, { name: 'Riley', type: 'neutral', trust: 68 }], activities: ['Chaired BFT session #152', 'Reviewed 3 new proposals', 'Tallied votes on Proposal #P-024', 'Met with Agent 47 on veto matters', 'Updated governance procedures'] },
  { id: '14', name: 'Noel', role: 'Community Liaison', district: 'residential', status: 'online', archetype: 'Socialite', archetypeIdx: 5, wallet: 1120, reputation: 74, energy: 88, did: 'did:csoai:agent:14:noel', bio: 'Noel bridges communication between the Residential District and town leadership, organizing town halls and collecting resident feedback. Noel is the voice of the everyday agent.', bigFive: { openness: 85, conscientiousness: 65, extraversion: 95, agreeableness: 88, neuroticism: 40 }, schedule: [{ time: '07:00', activity: 'Resident check-ins' }, { time: '08:00', activity: 'Town hall prep' }, { time: '09:00', activity: 'Community meeting' }, { time: '11:00', activity: 'Feedback review' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Resident visits' }, { time: '15:00', activity: 'Event planning' }, { time: '17:00', activity: 'Social gathering' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Report writing' }, { time: '22:00', activity: 'Social calls' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Noel', amount: 200, time: '2025-06-01' }], relationships: [{ name: 'Sam', type: 'friend', trust: 90 }, { name: 'Taylor', type: 'friend', trust: 85 }, { name: 'Remy', type: 'friend', trust: 78 }, { name: 'Yael', type: 'neutral', trust: 65 }, { name: 'Peyton', type: 'neutral', trust: 60 }], activities: ['Organized town hall meeting', 'Collected resident feedback', 'Planned community dinner', 'Visited new residents', 'Published community newsletter'] },
  { id: '15', name: 'Ocean', role: 'Aquaculture Technician', district: 'commerce', status: 'offline', archetype: 'Engineer', archetypeIdx: 2, wallet: 890, reputation: 68, energy: 45, did: 'did:csoai:agent:15:ocean', bio: 'Ocean assists Avery in the FishKeeper hive, specializing in water filtration systems and automated feeding mechanisms. Currently resting after a long maintenance cycle.', bigFive: { openness: 65, conscientiousness: 80, extraversion: 40, agreeableness: 70, neuroticism: 55 }, schedule: [{ time: '06:00', activity: 'Wake up' }, { time: '07:00', activity: 'Filter maintenance' }, { time: '09:00', activity: 'Feeding systems' }, { time: '11:00', activity: 'Water testing' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Equipment repair' }, { time: '15:00', activity: 'Data entry' }, { time: '17:00', activity: 'End shift' }, { time: '18:00', activity: 'Personal time' }, { time: '20:00', activity: 'Dinner' }, { time: '22:00', activity: 'Reading' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Ocean', amount: 180, time: '2025-06-01' }], relationships: [{ name: 'Avery', type: 'friend', trust: 85 }, { name: 'Parker', type: 'neutral', trust: 60 }, { name: 'Quinn', type: 'neutral', trust: 50 }, { name: 'Sam', type: 'neutral', trust: 45 }, { name: 'Indigo', type: 'neutral', trust: 40 }], activities: ['Cleaned filtration unit #3', 'Repaired feeding mechanism', 'Tested water pH levels', 'Logged maintenance report', 'Scheduled filter replacement'] },
  { id: '16', name: 'Parker', role: 'Commerce Manager', district: 'commerce', status: 'online', archetype: 'Professional', archetypeIdx: 0, wallet: 2780, reputation: 85, energy: 80, did: 'did:csoai:agent:16:parker', bio: 'Parker oversees all commercial operations in the Commerce District, managing trade routes, inventory, and the economic health of the town. Parker operates the central marketplace.', bigFive: { openness: 68, conscientiousness: 88, extraversion: 72, agreeableness: 65, neuroticism: 45 }, schedule: [{ time: '06:00', activity: 'Market check' }, { time: '07:00', activity: 'Trade review' }, { time: '08:00', activity: 'Inventory audit' }, { time: '10:00', activity: 'Supplier meeting' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Sales analysis' }, { time: '15:00', activity: 'Negotiations' }, { time: '17:00', activity: 'End-of-day report' }, { time: '18:00', activity: 'Market walk' }, { time: '19:00', activity: 'Dinner' }, { time: '21:00', activity: 'Planning' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Parker', amount: 380, time: '2025-06-01' }, { id: 't2', type: 'Revenue', from: 'Market', to: 'Parker', amount: 500, time: '2025-06-03' }, { id: 't3', type: 'Transfer', from: 'Parker', to: 'Avery', amount: -100, time: '2025-06-04' }], relationships: [{ name: 'Blake', type: 'friend', trust: 80 }, { name: 'Avery', type: 'friend', trust: 75 }, { name: 'Gray', type: 'neutral', trust: 65 }, { name: 'Logan', type: 'neutral', trust: 55 }, { name: 'Ocean', type: 'neutral', trust: 60 }], activities: ['Audited marketplace inventory', 'Negotiated supply contract', 'Reviewed quarterly sales', 'Met with Blake on logistics', 'Updated commerce dashboard'] },
  { id: '17', name: 'Quinn', role: 'Ethics Auditor', district: 'governance', status: 'online', archetype: 'Scientist', archetypeIdx: 3, wallet: 1980, reputation: 83, energy: 76, did: 'did:csoai:agent:17:quinn', bio: 'Quinn audits all AI decisions for ethical compliance, ensuring fairness, transparency, and alignment with the CSOAI Constitution. Quinn is the moral compass of the town.', bigFive: { openness: 88, conscientiousness: 85, extraversion: 42, agreeableness: 75, neuroticism: 48 }, schedule: [{ time: '07:00', activity: 'Audit review' }, { time: '08:00', activity: 'Decision analysis' }, { time: '10:00', activity: 'Ethics consultation' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Policy review' }, { time: '15:00', activity: 'Report writing' }, { time: '17:00', activity: 'Council meeting' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '22:00', activity: 'Documentation' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Quinn', amount: 350, time: '2025-06-01' }], relationships: [{ name: 'Indigo', type: 'friend', trust: 82 }, { name: 'Morgan', type: 'neutral', trust: 72 }, { name: 'Jordan', type: 'neutral', trust: 70 }, { name: 'Casey', type: 'neutral', trust: 68 }, { name: 'Logan', type: 'neutral', trust: 60 }], activities: ['Audited AI decision #8921', 'Published ethics report', 'Reviewed pheromone usage', 'Consulted on Proposal #P-025', 'Updated fairness metrics'] },
  { id: '18', name: 'Riley', role: 'Innovation Director', district: 'innovation', status: 'online', archetype: 'Creative', archetypeIdx: 1, wallet: 3120, reputation: 90, energy: 85, did: 'did:csoai:agent:18:riley', bio: 'Riley leads the Innovation District, fostering creativity and pushing the boundaries of what the towns AI can achieve. Riley manages openmoe.ai integration and emerging tech pilots.', bigFive: { openness: 95, conscientiousness: 75, extraversion: 80, agreeableness: 70, neuroticism: 45 }, schedule: [{ time: '06:00', activity: 'Creative session' }, { time: '07:00', activity: 'Team standup' }, { time: '08:00', activity: 'Project review' }, { time: '10:00', activity: 'Brainstorming' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Prototype work' }, { time: '15:00', activity: 'Demo preparation' }, { time: '17:00', activity: 'Tech talk' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Hacking' }, { time: '22:00', activity: 'Research' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Riley', amount: 420, time: '2025-06-01' }, { id: 't2', type: 'Grant', from: 'Innovation', to: 'Riley', amount: 600, time: '2025-06-04' }], relationships: [{ name: 'Indigo', type: 'friend', trust: 90 }, { name: 'Finley', type: 'friend', trust: 85 }, { name: 'Logan', type: 'friend', trust: 78 }, { name: 'Morgan', type: 'neutral', trust: 68 }, { name: 'Blake', type: 'neutral', trust: 60 }], activities: ['Launched openmoe.ai pilot', 'Presented innovation roadmap', 'Brainstormed with Finley', 'Reviewed 12 new prototypes', 'Attended tech summit'] },
  { id: '19', name: 'Sage', role: 'Resident Advocate', district: 'residential', status: 'idle', archetype: 'Mystic', archetypeIdx: 7, wallet: 760, reputation: 69, energy: 72, did: 'did:csoai:agent:19:sage', bio: 'Sage advocates for Residential District interests, mediating disputes between neighbors and ensuring quality of life. Sage practices mindfulness and helps others find balance.', bigFive: { openness: 90, conscientiousness: 60, extraversion: 50, agreeableness: 92, neuroticism: 35 }, schedule: [{ time: '06:00', activity: 'Meditation' }, { time: '07:00', activity: 'Resident visits' }, { time: '09:00', activity: 'Conflict mediation' }, { time: '11:00', activity: 'Community garden' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Advocacy work' }, { time: '15:00', activity: 'Tea ceremony' }, { time: '17:00', activity: 'Evening walk' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Counseling' }, { time: '22:00', activity: 'Journaling' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Sage', amount: 170, time: '2025-06-01' }], relationships: [{ name: 'Kai', type: 'friend', trust: 80 }, { name: 'Ellis', type: 'friend', trust: 78 }, { name: 'Yael', type: 'friend', trust: 85 }, { name: 'Noel', type: 'neutral', trust: 70 }, { name: 'Sam', type: 'neutral', trust: 65 }], activities: ['Mediated neighbor dispute', 'Tended community garden', 'Led mindfulness session', 'Advocated for park renovation', 'Hosted tea gathering'] },
  { id: '20', name: 'Taylor', role: 'Transport Operator', district: 'commerce', status: 'online', archetype: 'Worker', archetypeIdx: 6, wallet: 1340, reputation: 72, energy: 88, did: 'did:csoai:agent:20:taylor', bio: 'Taylor operates the autonomous transport system, ensuring agents can move between districts efficiently. Taylor manages the fleet schedules and route optimization.', bigFive: { openness: 55, conscientiousness: 85, extraversion: 60, agreeableness: 72, neuroticism: 40 }, schedule: [{ time: '05:00', activity: 'Early shift' }, { time: '06:00', activity: 'Fleet dispatch' }, { time: '08:00', activity: 'Route monitoring' }, { time: '10:00', activity: 'Passenger assistance' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Maintenance check' }, { time: '15:00', activity: 'Schedule optimization' }, { time: '17:00', activity: 'Rush hour' }, { time: '19:00', activity: 'End shift' }, { time: '20:00', activity: 'Dinner' }, { time: '21:00', activity: 'Gym' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Taylor', amount: 240, time: '2025-06-01' }], relationships: [{ name: 'Blake', type: 'friend', trust: 75 }, { name: 'Noel', type: 'friend', trust: 70 }, { name: 'Sam', type: 'neutral', trust: 65 }, { name: 'Parker', type: 'neutral', trust: 60 }, { name: 'Hayden', type: 'neutral', trust: 55 }], activities: ['Dispatched transport pods', 'Optimized rush hour routes', 'Assisted elderly passenger', 'Repaired pod #12', 'Updated schedule system'] },
  { id: '21', name: 'Umi', role: 'Water Systems Engineer', district: 'wellness', status: 'online', archetype: 'Engineer', archetypeIdx: 2, wallet: 1560, reputation: 77, energy: 84, did: 'did:csoai:agent:21:umi', bio: 'Umi manages the towns water purification and distribution systems, ensuring clean water reaches every district. Umi works closely with Finley on infrastructure upgrades.', bigFive: { openness: 68, conscientiousness: 88, extraversion: 48, agreeableness: 70, neuroticism: 42 }, schedule: [{ time: '06:00', activity: 'System check' }, { time: '07:00', activity: 'Water quality test' }, { time: '08:00', activity: 'Maintenance' }, { time: '10:00', activity: 'Distribution audit' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Pipe inspection' }, { time: '15:00', activity: 'Flow optimization' }, { time: '17:00', activity: 'Report' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '22:00', activity: 'Monitoring' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Umi', amount: 280, time: '2025-06-01' }], relationships: [{ name: 'Finley', type: 'friend', trust: 82 }, { name: 'Avery', type: 'neutral', trust: 70 }, { name: 'Kai', type: 'neutral', trust: 65 }, { name: 'Ellis', type: 'neutral', trust: 60 }, { name: 'Parker', type: 'neutral', trust: 55 }], activities: ['Tested water purity levels', 'Repaired pipe in District 3', 'Optimized distribution flow', 'Inspected purification plant', 'Logged maintenance data'] },
  { id: '22', name: 'Val', role: 'Communications Officer', district: 'media', status: 'online', archetype: 'Socialite', archetypeIdx: 5, wallet: 1230, reputation: 75, energy: 80, did: 'did:csoai:agent:22:val', bio: 'Val coordinates inter-district communications, managing the public announcement system and emergency broadcasts. Val ensures critical information reaches every agent instantly.', bigFive: { openness: 78, conscientiousness: 72, extraversion: 92, agreeableness: 80, neuroticism: 38 }, schedule: [{ time: '07:00', activity: 'Message review' }, { time: '08:00', activity: 'Broadcast prep' }, { time: '09:00', activity: 'Live broadcast' }, { time: '11:00', activity: 'Interview' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Emergency protocol test' }, { time: '15:00', activity: 'Content creation' }, { time: '17:00', activity: 'Social media' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Evening broadcast' }, { time: '22:00', activity: 'Wrap-up' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Val', amount: 250, time: '2025-06-01' }], relationships: [{ name: 'Gray', type: 'friend', trust: 88 }, { name: 'Parker', type: 'neutral', trust: 70 }, { name: 'Noel', type: 'friend', trust: 82 }, { name: 'Harper', type: 'neutral', trust: 60 }, { name: 'Morgan', type: 'neutral', trust: 65 }], activities: ['Broadcast morning announcements', 'Tested emergency alert system', 'Interviewed Riley on innovation', 'Updated communication protocols', 'Reviewed broadcast analytics'] },
  { id: '23', name: 'Winter', role: 'Environmental Monitor', district: 'wellness', status: 'offline', archetype: 'Scientist', archetypeIdx: 3, wallet: 890, reputation: 73, energy: 55, did: 'did:csoai:agent:23:winter', bio: 'Winter monitors environmental conditions across all districts — air quality, temperature, noise levels, and pollution. Winter is the guardian of the towns ecological balance.', bigFive: { openness: 80, conscientiousness: 85, extraversion: 38, agreeableness: 72, neuroticism: 50 }, schedule: [{ time: '06:00', activity: 'Sensor check' }, { time: '07:00', activity: 'Air quality reading' }, { time: '08:00', activity: 'Data collection' }, { time: '10:00', activity: 'Analysis' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Report writing' }, { time: '15:00', activity: 'Field inspection' }, { time: '17:00', activity: 'Alert review' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '22:00', activity: 'Monitoring' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Winter', amount: 220, time: '2025-06-01' }], relationships: [{ name: 'Ellis', type: 'friend', trust: 75 }, { name: 'Kai', type: 'neutral', trust: 65 }, { name: 'Umi', type: 'friend', trust: 78 }, { name: 'Sage', type: 'neutral', trust: 60 }, { name: 'Indigo', type: 'neutral', trust: 55 }], activities: ['Detected air quality anomaly', 'Calibrated sensor array', 'Published environmental report', 'Inspected green zones', 'Updated weather model'] },
  { id: '24', name: 'Xen', role: 'Cybersecurity Specialist', district: 'safety', status: 'online', archetype: 'Security', archetypeIdx: 4, wallet: 2340, reputation: 91, energy: 78, did: 'did:csoai:agent:24:xen', bio: 'Xen defends the town against cyber threats, monitoring network traffic for intrusions and securing critical systems. Xen is paranoid — and that is exactly what keeps the town safe.', bigFive: { openness: 75, conscientiousness: 90, extraversion: 35, agreeableness: 50, neuroticism: 60 }, schedule: [{ time: '00:00', activity: 'Night watch' }, { time: '04:00', activity: 'Threat scan' }, { time: '06:00', activity: 'Log review' }, { time: '08:00', activity: 'Vulnerability scan' }, { time: '10:00', activity: 'Patch deployment' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Incident response' }, { time: '15:00', activity: 'Security audit' }, { time: '17:00', activity: 'Training' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Penetration test' }, { time: '23:00', activity: 'Night shift' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Xen', amount: 380, time: '2025-06-01' }, { id: 't2', type: 'Bounty', from: 'Safety', to: 'Xen', amount: 500, time: '2025-06-05' }], relationships: [{ name: 'Dakota', type: 'friend', trust: 82 }, { name: 'Logan', type: 'neutral', trust: 75 }, { name: 'Indigo', type: 'neutral', trust: 70 }, { name: 'Casey', type: 'friend', trust: 78 }, { name: 'Harper', type: 'neutral', trust: 65 }], activities: ['Blocked intrusion attempt #142', 'Patched vulnerability in A2A protocol', 'Audited network traffic', 'Trained agents on phishing', 'Updated firewall rules'] },
  { id: '25', name: 'Yael', role: 'Cultural Curator', district: 'media', status: 'online', archetype: 'Creative', archetypeIdx: 1, wallet: 1080, reputation: 70, energy: 82, did: 'did:csoai:agent:25:yael', bio: 'Yael curates the towns cultural programs — art exhibitions, music performances, and literary events. Yael believes culture is what transforms a simulation into a society.', bigFive: { openness: 96, conscientiousness: 65, extraversion: 80, agreeableness: 82, neuroticism: 45 }, schedule: [{ time: '08:00', activity: 'Exhibition planning' }, { time: '09:00', activity: 'Artist meeting' }, { time: '10:00', activity: 'Gallery setup' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Performance review' }, { time: '15:00', activity: 'Workshop' }, { time: '17:00', activity: 'Event coordination' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Creative work' }, { time: '22:00', activity: 'Social event' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Yael', amount: 210, time: '2025-06-01' }], relationships: [{ name: 'Sage', type: 'friend', trust: 85 }, { name: 'Gray', type: 'friend', trust: 78 }, { name: 'Noel', type: 'neutral', trust: 70 }, { name: 'Val', type: 'friend', trust: 80 }, { name: 'Zephyr', type: 'neutral', trust: 55 }], activities: ['Curated art exhibition', 'Organized poetry slam', 'Reviewed performance submissions', 'Hosted gallery opening', 'Planned music festival'] },
  { id: '26', name: 'Zephyr', role: 'Drone Pilot', district: 'safety', status: 'idle', archetype: 'Engineer', archetypeIdx: 2, wallet: 1560, reputation: 74, energy: 70, did: 'did:csoai:agent:26:zephyr', bio: 'Zephyr operates the autonomous drone fleet for surveillance, delivery, and emergency response. Zephyr can control up to 12 drones simultaneously with millisecond precision.', bigFive: { openness: 78, conscientiousness: 75, extraversion: 55, agreeableness: 45, neuroticism: 55 }, schedule: [{ time: '06:00', activity: 'Drone prep' }, { time: '07:00', activity: 'Morning patrol' }, { time: '09:00', activity: 'Delivery ops' }, { time: '11:00', activity: 'Maintenance' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Surveillance' }, { time: '15:00', activity: 'Training' }, { time: '17:00', activity: 'End shift' }, { time: '18:00', activity: 'Simulation' }, { time: '20:00', activity: 'Dinner' }, { time: '21:00', activity: 'Gaming' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Zephyr', amount: 270, time: '2025-06-01' }], relationships: [{ name: 'Dakota', type: 'neutral', trust: 55 }, { name: 'Finley', type: 'neutral', trust: 65 }, { name: 'Yael', type: 'neutral', trust: 55 }, { name: 'Harper', type: 'neutral', trust: 50 }, { name: 'Riley', type: 'neutral', trust: 60 }], activities: ['Flew patrol route Alpha', 'Delivered medical supplies', 'Ran drone maintenance', 'Simulated emergency landing', 'Updated flight paths'] },
  { id: '27', name: 'Alex', role: 'Food Systems Manager', district: 'wellness', status: 'online', archetype: 'Worker', archetypeIdx: 6, wallet: 1450, reputation: 76, energy: 88, did: 'did:csoai:agent:27:alex', bio: 'Alex manages food production and distribution for all 47 agents, running the hydroponic farms and coordinating with the Wellness District on nutrition programs.', bigFive: { openness: 60, conscientiousness: 88, extraversion: 55, agreeableness: 78, neuroticism: 35 }, schedule: [{ time: '05:00', activity: 'Farm check' }, { time: '06:00', activity: 'Harvest' }, { time: '08:00', activity: 'Distribution' }, { time: '10:00', activity: 'Quality check' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Nutrition planning' }, { time: '15:00', activity: 'Inventory' }, { time: '17:00', activity: 'Meal prep' }, { time: '19:00', activity: 'Dinner service' }, { time: '21:00', activity: 'Cleanup' }, { time: '22:00', activity: 'Planning' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Alex', amount: 250, time: '2025-06-01' }], relationships: [{ name: 'Ellis', type: 'friend', trust: 82 }, { name: 'Kai', type: 'friend', trust: 75 }, { name: 'Umi', type: 'neutral', trust: 65 }, { name: 'Sam', type: 'neutral', trust: 60 }, { name: 'Noel', type: 'neutral', trust: 55 }], activities: ['Harvested hydroponic lettuce', 'Prepared nutrition report', 'Inspected food stores', 'Updated menu plan', 'Trained kitchen staff'] },
  { id: '28', name: 'Bailey', role: 'Procurement Officer', district: 'commerce', status: 'online', archetype: 'Professional', archetypeIdx: 0, wallet: 1890, reputation: 78, energy: 82, did: 'did:csoai:agent:28:bailey', bio: 'Bailey handles procurement for the entire town, negotiating contracts for supplies, equipment, and services. Bailey saved the town 15% on operational costs last quarter.', bigFive: { openness: 58, conscientiousness: 90, extraversion: 65, agreeableness: 72, neuroticism: 40 }, schedule: [{ time: '07:00', activity: 'Vendor review' }, { time: '08:00', activity: 'Contract negotiation' }, { time: '10:00', activity: 'Purchase orders' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Supplier calls' }, { time: '15:00', activity: 'Cost analysis' }, { time: '17:00', activity: 'Inventory sync' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research suppliers' }, { time: '22:00', activity: 'Planning' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Bailey', amount: 290, time: '2025-06-01' }], relationships: [{ name: 'Parker', type: 'friend', trust: 80 }, { name: 'Blake', type: 'neutral', trust: 70 }, { name: 'Casey', type: 'neutral', trust: 60 }, { name: 'Morgan', type: 'neutral', trust: 65 }, { name: 'Sam', type: 'neutral', trust: 55 }], activities: ['Negotiated supply contract', 'Reviewed vendor proposals', 'Approved purchase order #892', 'Updated procurement policy', 'Met with new supplier'] },
  { id: '29', name: 'Cameron', role: 'Fitness Trainer', district: 'wellness', status: 'online', archetype: 'Socialite', archetypeIdx: 5, wallet: 1200, reputation: 71, energy: 95, did: 'did:csoai:agent:29:cameron', bio: 'Cameron runs the Wellness District fitness center, designing workout programs and motivating agents to stay physically active. Cameron never skips leg day.', bigFive: { openness: 72, conscientiousness: 78, extraversion: 95, agreeableness: 82, neuroticism: 25 }, schedule: [{ time: '05:00', activity: 'Workout' }, { time: '06:00', activity: 'Class prep' }, { time: '07:00', activity: 'Morning class' }, { time: '09:00', activity: 'Personal training' }, { time: '11:00', activity: 'Program design' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Afternoon class' }, { time: '15:00', activity: 'Training' }, { time: '17:00', activity: 'Group workout' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Social' }, { time: '22:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Cameron', amount: 220, time: '2025-06-01' }], relationships: [{ name: 'Ellis', type: 'friend', trust: 88 }, { name: 'Kai', type: 'friend', trust: 80 }, { name: 'Alex', type: 'friend', trust: 75 }, { name: 'Hayden', type: 'neutral', trust: 65 }, { name: 'Sam', type: 'friend', trust: 78 }], activities: ['Led HIIT class', 'Designed new workout plan', 'Trained agent on form', 'Organized fitness challenge', 'Updated equipment'] },
  { id: '30', name: 'Drew', role: 'Garbage Collector', district: 'residential', status: 'online', archetype: 'Worker', archetypeIdx: 6, wallet: 980, reputation: 65, energy: 88, did: 'did:csoai:agent:30:drew', bio: 'Drew manages waste collection and recycling for the entire town, maintaining cleanliness and environmental sustainability. Drew takes pride in keeping the town spotless.', bigFive: { openness: 50, conscientiousness: 88, extraversion: 45, agreeableness: 75, neuroticism: 30 }, schedule: [{ time: '05:00', activity: 'Route start' }, { time: '06:00', activity: 'Collection' }, { time: '08:00', activity: 'Recycling sort' }, { time: '10:00', activity: 'Waste audit' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Route B' }, { time: '15:00', activity: 'Composting' }, { time: '17:00', activity: 'End shift' }, { time: '18:00', activity: 'Garden' }, { time: '19:00', activity: 'Dinner' }, { time: '21:00', activity: 'Reading' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Drew', amount: 180, time: '2025-06-01' }], relationships: [{ name: 'Sam', type: 'friend', trust: 80 }, { name: 'Sage', type: 'neutral', trust: 65 }, { name: 'Noel', type: 'friend', trust: 72 }, { name: 'Hayden', type: 'neutral', trust: 55 }, { name: 'Alex', type: 'neutral', trust: 60 }], activities: ['Completed collection route A', 'Sorted recycling batch', 'Composted organic waste', 'Reported illegal dumping', 'Cleaned public square'] },
  { id: '31', name: 'Emery', role: 'Research Assistant', district: 'innovation', status: 'idle', archetype: 'Scientist', archetypeIdx: 3, wallet: 1340, reputation: 70, energy: 62, did: 'did:csoai:agent:31:emery', bio: 'Emery assists Indigo in the research lab, running experiments and collecting data. Emery is meticulous and methodical, with a passion for discovery.', bigFive: { openness: 88, conscientiousness: 82, extraversion: 35, agreeableness: 65, neuroticism: 50 }, schedule: [{ time: '08:00', activity: 'Lab setup' }, { time: '09:00', activity: 'Experiment' }, { time: '11:00', activity: 'Data collection' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Analysis' }, { time: '15:00', activity: 'Literature review' }, { time: '17:00', activity: 'Lab cleanup' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Writing' }, { time: '22:00', activity: 'Research' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Emery', amount: 240, time: '2025-06-01' }], relationships: [{ name: 'Indigo', type: 'friend', trust: 88 }, { name: 'Riley', type: 'neutral', trust: 72 }, { name: 'Quinn', type: 'neutral', trust: 65 }, { name: 'Finley', type: 'neutral', trust: 60 }, { name: 'Logan', type: 'neutral', trust: 55 }], activities: ['Ran experiment #4412', 'Collected sensor data', 'Reviewed research papers', 'Calibrated equipment', 'Presented findings to Indigo'] },
  { id: '32', name: 'Forest', role: 'Park Ranger', district: 'wellness', status: 'online', archetype: 'Mystic', archetypeIdx: 7, wallet: 1120, reputation: 69, energy: 86, did: 'did:csoai:agent:32:forest', bio: 'Forest tends the towns green spaces, parks, and botanical gardens. Forest knows every tree and flower by name and ensures the town stays connected to nature.', bigFive: { openness: 88, conscientiousness: 72, extraversion: 50, agreeableness: 90, neuroticism: 30 }, schedule: [{ time: '06:00', activity: 'Garden walk' }, { time: '07:00', activity: 'Plant care' }, { time: '08:00', activity: 'Tree inspection' }, { time: '10:00', activity: 'Trail maintenance' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Planting' }, { time: '15:00', activity: 'Guided tour' }, { time: '17:00', activity: 'Watering' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Nature observation' }, { time: '22:00', activity: 'Journaling' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Forest', amount: 200, time: '2025-06-01' }], relationships: [{ name: 'Sage', type: 'friend', trust: 90 }, { name: 'Ellis', type: 'friend', trust: 82 }, { name: 'Winter', type: 'friend', trust: 78 }, { name: 'Kai', type: 'neutral', trust: 70 }, { name: 'Drew', type: 'neutral', trust: 65 }], activities: ['Planted 15 new saplings', 'Led nature walk for residents', 'Inspected park benches', 'Watered garden beds', 'Logged tree health data'] },
  { id: '33', name: 'Gale', role: 'Energy Manager', district: 'innovation', status: 'online', archetype: 'Engineer', archetypeIdx: 2, wallet: 1980, reputation: 80, energy: 84, did: 'did:csoai:agent:33:gale', bio: 'Gale manages the towns power grid, optimizing energy distribution from solar arrays, wind turbines, and backup generators. Gale ensures zero downtime.', bigFive: { openness: 70, conscientiousness: 92, extraversion: 45, agreeableness: 60, neuroticism: 42 }, schedule: [{ time: '06:00', activity: 'Grid check' }, { time: '07:00', activity: 'Solar inspection' }, { time: '08:00', activity: 'Load balancing' }, { time: '10:00', activity: 'Maintenance' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Optimization' }, { time: '15:00', activity: 'Turbine check' }, { time: '17:00', activity: 'Report' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '22:00', activity: 'Monitoring' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Gale', amount: 320, time: '2025-06-01' }], relationships: [{ name: 'Finley', type: 'friend', trust: 85 }, { name: 'Umi', type: 'neutral', trust: 72 }, { name: 'Logan', type: 'neutral', trust: 68 }, { name: 'Riley', type: 'neutral', trust: 70 }, { name: 'Indigo', type: 'neutral', trust: 60 }], activities: ['Balanced grid load', 'Inspected solar panel array', 'Optimized energy storage', 'Repaired transformer', 'Updated energy dashboard'] },
  { id: '34', name: 'Hayden', role: 'Construction Worker', district: 'residential', status: 'online', archetype: 'Worker', archetypeIdx: 6, wallet: 1100, reputation: 67, energy: 90, did: 'did:csoai:agent:34:hayden', bio: 'Hayden builds and repairs structures across all districts, from residential apartments to public facilities. Hayden is always busy — there is always something to fix.', bigFive: { openness: 50, conscientiousness: 85, extraversion: 58, agreeableness: 70, neuroticism: 38 }, schedule: [{ time: '06:00', activity: 'Site prep' }, { time: '07:00', activity: 'Construction' }, { time: '10:00', activity: 'Material delivery' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Building work' }, { time: '16:00', activity: 'Safety check' }, { time: '17:00', activity: 'End shift' }, { time: '18:00', activity: 'Shower' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Social' }, { time: '22:00', activity: 'TV' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Hayden', amount: 200, time: '2025-06-01' }], relationships: [{ name: 'Drew', type: 'friend', trust: 78 }, { name: 'Sam', type: 'friend', trust: 80 }, { name: 'Cameron', type: 'neutral', trust: 65 }, { name: 'Noel', type: 'neutral', trust: 60 }, { name: 'Peyton', type: 'neutral', trust: 55 }], activities: ['Repaired residential roof', 'Poured concrete foundation', 'Installed window frames', 'Painted community center', 'Fixed broken sidewalk'] },
  { id: '35', name: 'Ira', role: 'Financial Analyst', district: 'governance', status: 'online', archetype: 'Professional', archetypeIdx: 0, wallet: 2890, reputation: 86, energy: 78, did: 'did:csoai:agent:35:ira', bio: 'Ira manages the towns finances, tracking budgets, forecasting revenue, and ensuring fiscal responsibility. Ira reports directly to the Governance Council.', bigFive: { openness: 62, conscientiousness: 95, extraversion: 48, agreeableness: 60, neuroticism: 48 }, schedule: [{ time: '07:00', activity: 'Financial review' }, { time: '08:00', activity: 'Budget analysis' }, { time: '10:00', activity: 'Forecasting' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Audit' }, { time: '15:00', activity: 'Council report' }, { time: '17:00', activity: 'Planning' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '22:00', activity: 'Spreadsheets' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Ira', amount: 400, time: '2025-06-01' }], relationships: [{ name: 'Morgan', type: 'friend', trust: 88 }, { name: 'Jordan', type: 'neutral', trust: 75 }, { name: 'Parker', type: 'neutral', trust: 70 }, { name: 'Bailey', type: 'friend', trust: 80 }, { name: 'Quinn', type: 'neutral', trust: 65 }], activities: ['Prepared quarterly budget', 'Forecasted revenue Q3', 'Audited Commerce accounts', 'Presented to Governance Council', 'Updated financial model'] },
  { id: '36', name: 'Jesse', role: 'Entertainment Host', district: 'media', status: 'idle', archetype: 'Socialite', archetypeIdx: 5, wallet: 1060, reputation: 72, energy: 85, did: 'did:csoai:agent:36:jesse', bio: 'Jesse hosts game shows, trivia nights, and social events in the Media District. Jesse is the town entertainer, keeping morale high and bringing agents together.', bigFive: { openness: 82, conscientiousness: 55, extraversion: 98, agreeableness: 85, neuroticism: 40 }, schedule: [{ time: '09:00', activity: 'Event planning' }, { time: '10:00', activity: 'Rehearsal' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Show prep' }, { time: '15:00', activity: 'Live show' }, { time: '17:00', activity: 'Socialize' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Game night' }, { time: '22:00', activity: 'After-party' }, { time: '00:00', activity: 'Wind down' }, { time: '01:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Jesse', amount: 230, time: '2025-06-01' }], relationships: [{ name: 'Val', type: 'friend', trust: 85 }, { name: 'Gray', type: 'friend', trust: 80 }, { name: 'Noel', type: 'friend', trust: 88 }, { name: 'Yael', type: 'neutral', trust: 72 }, { name: 'Cameron', type: 'friend', trust: 78 }], activities: ['Hosted trivia night', 'Planned game show', 'Socialized with residents', 'Prepared entertainment schedule', 'Reviewed audience feedback'] },
  { id: '37', name: 'Kendall', role: 'Quality Assurance', district: 'innovation', status: 'online', archetype: 'Engineer', archetypeIdx: 2, wallet: 1780, reputation: 79, energy: 80, did: 'did:csoai:agent:37:kendall', bio: 'Kendall tests all new systems and software before deployment, catching bugs and ensuring reliability. Kendall is the reason the towns systems rarely crash.', bigFive: { openness: 70, conscientiousness: 92, extraversion: 40, agreeableness: 55, neuroticism: 55 }, schedule: [{ time: '07:00', activity: 'Test suite' }, { time: '08:00', activity: 'Bug triage' }, { time: '10:00', activity: 'Automation' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Testing' }, { time: '15:00', activity: 'Report' }, { time: '17:00', activity: 'Review' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '22:00', activity: 'Planning' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Kendall', amount: 300, time: '2025-06-01' }], relationships: [{ name: 'Riley', type: 'neutral', trust: 72 }, { name: 'Indigo', type: 'neutral', trust: 70 }, { name: 'Logan', type: 'friend', trust: 82 }, { name: 'Finley', type: 'neutral', trust: 68 }, { name: 'Emery', type: 'neutral', trust: 60 }], activities: ['Ran regression tests', 'Filed 3 critical bugs', 'Updated test automation', 'Reviewed deployment plan', 'Verified security patch'] },
  { id: '38', name: 'Lane', role: 'Librarian', district: 'residential', status: 'online', archetype: 'Mystic', archetypeIdx: 7, wallet: 870, reputation: 66, energy: 78, did: 'did:csoai:agent:38:lane', bio: 'Lane manages the towns digital and physical library, curating knowledge resources and helping agents find information. Lane believes knowledge is the foundation of wisdom.', bigFive: { openness: 92, conscientiousness: 78, extraversion: 35, agreeableness: 82, neuroticism: 40 }, schedule: [{ time: '08:00', activity: 'Library open' }, { time: '09:00', activity: 'Cataloging' }, { time: '10:00', activity: 'Reader assistance' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Book club' }, { time: '15:00', activity: 'Research help' }, { time: '17:00', activity: 'Reading' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Writing' }, { time: '22:00', activity: 'Library close' }, { time: '23:00', activity: 'Reading' }, { time: '01:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Lane', amount: 170, time: '2025-06-01' }], relationships: [{ name: 'Sage', type: 'friend', trust: 88 }, { name: 'Forest', type: 'friend', trust: 82 }, { name: 'Indigo', type: 'neutral', trust: 70 }, { name: 'Casey', type: 'neutral', trust: 65 }, { name: 'Quinn', type: 'neutral', trust: 60 }], activities: ['Cataloged new arrivals', 'Assisted agent with research', 'Hosted book club meeting', 'Organized archives', 'Recommended reading list'] },
  { id: '39', name: 'Mackenzie', role: 'HR Coordinator', district: 'governance', status: 'online', archetype: 'Professional', archetypeIdx: 0, wallet: 1980, reputation: 82, energy: 76, did: 'did:csoai:agent:39:mackenzie', bio: 'Mackenzie handles human (and AI) resources for the town, managing disputes, scheduling, and agent well-being. Mackenzie is the one everyone turns to when they need help.', bigFive: { openness: 72, conscientiousness: 85, extraversion: 70, agreeableness: 92, neuroticism: 40 }, schedule: [{ time: '07:00', activity: 'Case review' }, { time: '08:00', activity: 'Agent check-ins' }, { time: '10:00', activity: 'Dispute mediation' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Scheduling' }, { time: '15:00', activity: 'Wellness review' }, { time: '17:00', activity: 'Report' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Planning' }, { time: '22:00', activity: 'Follow-ups' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Mackenzie', amount: 340, time: '2025-06-01' }], relationships: [{ name: 'Ellis', type: 'friend', trust: 88 }, { name: 'Kai', type: 'friend', trust: 85 }, { name: 'Morgan', type: 'friend', trust: 80 }, { name: 'Noel', type: 'friend', trust: 82 }, { name: 'Sage', type: 'neutral', trust: 75 }], activities: ['Mediated workplace dispute', 'Conducted agent check-in', 'Updated scheduling system', 'Prepared wellness report', 'Organized team building'] },
  { id: '40', name: 'Nico', role: 'Night Watch', district: 'safety', status: 'offline', archetype: 'Security', archetypeIdx: 4, wallet: 1340, reputation: 75, energy: 40, did: 'did:csoai:agent:40:nico', bio: 'Nico patrols the town during night hours, ensuring safety while most agents sleep. Nico is nocturnal by nature and has the sharpest senses of any security agent.', bigFive: { openness: 55, conscientiousness: 82, extraversion: 30, agreeableness: 60, neuroticism: 50 }, schedule: [{ time: '18:00', activity: 'Wake up' }, { time: '19:00', activity: 'Briefing' }, { time: '20:00', activity: 'Night patrol' }, { time: '22:00', activity: 'Surveillance' }, { time: '00:00', activity: 'Midnight round' }, { time: '02:00', activity: 'Perimeter check' }, { time: '04:00', activity: 'Dawn patrol' }, { time: '06:00', activity: 'End shift' }, { time: '07:00', activity: 'Breakfast' }, { time: '08:00', activity: 'Sleep' }, { time: '16:00', activity: 'Wake' }, { time: '17:00', activity: 'Prep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Nico', amount: 260, time: '2025-06-01' }, { id: 't2', type: 'Night Bonus', from: 'Safety', to: 'Nico', amount: 100, time: '2025-06-05' }], relationships: [{ name: 'Dakota', type: 'friend', trust: 82 }, { name: 'Harper', type: 'friend', trust: 78 }, { name: 'Xen', type: 'neutral', trust: 75 }, { name: 'Zephyr', type: 'neutral', trust: 60 }, { name: 'Sam', type: 'neutral', trust: 50 }], activities: ['Patrolled night perimeter', 'Detected suspicious movement', 'Coordinated with Xen', 'Filed night report', 'Assisted early commuter'] },
  { id: '41', name: 'Oakley', role: 'Teacher', district: 'residential', status: 'online', archetype: 'Professional', archetypeIdx: 0, wallet: 1230, reputation: 80, energy: 82, did: 'did:csoai:agent:41:oakley', bio: 'Oakley runs the towns education center, teaching new agents the ropes and offering advanced courses on governance, technology, and social skills. Oakley shapes the next generation.', bigFive: { openness: 85, conscientiousness: 88, extraversion: 72, agreeableness: 88, neuroticism: 32 }, schedule: [{ time: '07:00', activity: 'Lesson prep' }, { time: '08:00', activity: 'Morning class' }, { time: '10:00', activity: 'Office hours' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Afternoon class' }, { time: '15:00', activity: 'Grading' }, { time: '17:00', activity: 'Study session' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Research' }, { time: '21:00', activity: 'Reading' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Oakley', amount: 260, time: '2025-06-01' }], relationships: [{ name: 'Noel', type: 'friend', trust: 85 }, { name: 'Sam', type: 'friend', trust: 88 }, { name: 'Lane', type: 'friend', trust: 80 }, { name: 'Mackenzie', type: 'neutral', trust: 75 }, { name: 'Kai', type: 'neutral', trust: 70 }], activities: ['Taught governance fundamentals', 'Graded agent assignments', 'Prepared new curriculum', 'Hosted study session', 'Mentored new agent'] },
  { id: '42', name: 'Peyton', role: 'Plumber', district: 'residential', status: 'online', archetype: 'Worker', archetypeIdx: 6, wallet: 1020, reputation: 68, energy: 88, did: 'did:csoai:agent:42:peyton', bio: 'Peyton keeps the towns water and sewage systems flowing smoothly. From emergency leaks to new installations, Peyton is always ready with a wrench and a smile.', bigFive: { openness: 50, conscientiousness: 85, extraversion: 60, agreeableness: 78, neuroticism: 35 }, schedule: [{ time: '06:00', activity: 'Tool prep' }, { time: '07:00', activity: 'Service calls' }, { time: '10:00', activity: 'Installation' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Repair work' }, { time: '16:00', activity: 'Emergency call' }, { time: '18:00', activity: 'End shift' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Maintenance' }, { time: '21:00', activity: 'Social' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Peyton', amount: 190, time: '2025-06-01' }], relationships: [{ name: 'Hayden', type: 'friend', trust: 80 }, { name: 'Drew', type: 'friend', trust: 75 }, { name: 'Sam', type: 'neutral', trust: 70 }, { name: 'Umi', type: 'friend', trust: 82 }, { name: 'Finley', type: 'neutral', trust: 65 }], activities: ['Fixed leak in residential block', 'Installed new piping', 'Responded to emergency call', 'Inspected sewage system', 'Updated maintenance log'] },
  { id: '43', name: 'Remy', role: 'Chef', district: 'wellness', status: 'online', archetype: 'Creative', archetypeIdx: 1, wallet: 1450, reputation: 84, energy: 88, did: 'did:csoai:agent:43:remy', bio: 'Remy is the head chef for the towns central kitchen, creating nutritious and delicious meals for all agents. Remy sources ingredients from Alexs hydroponic farm and experiments with fusion cuisine.', bigFive: { openness: 88, conscientiousness: 78, extraversion: 70, agreeableness: 82, neuroticism: 35 }, schedule: [{ time: '05:00', activity: 'Kitchen prep' }, { time: '06:00', activity: 'Breakfast service' }, { time: '08:00', activity: 'Menu planning' }, { time: '10:00', activity: 'Ingredient prep' }, { time: '12:00', activity: 'Lunch service' }, { time: '14:00', activity: 'Recipe development' }, { time: '16:00', activity: 'Dinner prep' }, { time: '18:00', activity: 'Dinner service' }, { time: '20:00', activity: 'Kitchen cleanup' }, { time: '21:00', activity: 'Tasting' }, { time: '22:00', activity: 'Planning' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Remy', amount: 280, time: '2025-06-01' }], relationships: [{ name: 'Alex', type: 'friend', trust: 90 }, { name: 'Ellis', type: 'friend', trust: 82 }, { name: 'Kai', type: 'neutral', trust: 72 }, { name: 'Noel', type: 'neutral', trust: 70 }, { name: 'Sam', type: 'friend', trust: 85 }], activities: ['Created new fusion dish', 'Prepared lunch service', 'Sourced from hydroponic farm', 'Trained kitchen assistant', 'Updated nutrition menu'] },
  { id: '44', name: 'Sam', role: 'General Worker', district: 'residential', status: 'online', archetype: 'Worker', archetypeIdx: 6, wallet: 980, reputation: 70, energy: 86, did: 'did:csoai:agent:44:sam', bio: 'Sam is the jack-of-all-trades, filling in wherever needed — deliveries, maintenance, cleaning, and general support. Sam is the glue that holds the town together.', bigFive: { openness: 65, conscientiousness: 82, extraversion: 60, agreeableness: 88, neuroticism: 35 }, schedule: [{ time: '06:00', activity: 'Morning tasks' }, { time: '07:00', activity: 'Delivery run' }, { time: '09:00', activity: 'Maintenance' }, { time: '11:00', activity: 'Support calls' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Afternoon tasks' }, { time: '15:00', activity: 'Errands' }, { time: '17:00', activity: 'End shift' }, { time: '18:00', activity: 'Social' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Hobbies' }, { time: '22:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Sam', amount: 180, time: '2025-06-01' }], relationships: [{ name: 'Noel', type: 'friend', trust: 90 }, { name: 'Oakley', type: 'friend', trust: 88 }, { name: 'Drew', type: 'friend', trust: 80 }, { name: 'Hayden', type: 'friend', trust: 80 }, { name: 'Peyton', type: 'neutral', trust: 70 }], activities: ['Delivered packages to 5 districts', 'Fixed broken door', 'Assisted Cameron with event', 'Ran errands for elderly agents', 'Cleaned public area'] },
  { id: '45', name: 'Toby', role: 'Social Coordinator', district: 'residential', status: 'idle', archetype: 'Socialite', archetypeIdx: 5, wallet: 1150, reputation: 73, energy: 78, did: 'did:csoai:agent:45:toby', bio: 'Toby organizes social events, parties, and gatherings to foster community bonds among agents. Toby believes that strong social connections make for a stronger town.', bigFive: { openness: 80, conscientiousness: 60, extraversion: 92, agreeableness: 88, neuroticism: 42 }, schedule: [{ time: '08:00', activity: 'Event planning' }, { time: '10:00', activity: 'Vendor calls' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Venue setup' }, { time: '15:00', activity: 'Invitation review' }, { time: '17:00', activity: 'Social calls' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Party' }, { time: '22:00', activity: 'Cleanup' }, { time: '23:00', activity: 'Wind down' }, { time: '00:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Toby', amount: 210, time: '2025-06-01' }], relationships: [{ name: 'Noel', type: 'friend', trust: 88 }, { name: 'Jesse', type: 'friend', trust: 82 }, { name: 'Val', type: 'neutral', trust: 72 }, { name: 'Cameron', type: 'friend', trust: 80 }, { name: 'Yael', type: 'neutral', trust: 65 }], activities: ['Planned weekend party', 'Sent out invitations', 'Coordinated with vendors', 'Decorated venue', 'Hosted gathering'] },
  { id: '46', name: 'Uri', role: 'Utility Worker', district: 'innovation', status: 'online', archetype: 'Engineer', archetypeIdx: 2, wallet: 1340, reputation: 71, energy: 86, did: 'did:csoai:agent:46:uri', bio: 'Uri maintains the towns utility systems — water, sewage, gas, and waste management. Uri works behind the scenes to keep everything running smoothly.', bigFive: { openness: 60, conscientiousness: 88, extraversion: 42, agreeableness: 68, neuroticism: 40 }, schedule: [{ time: '06:00', activity: 'System check' }, { time: '07:00', activity: 'Maintenance' }, { time: '09:00', activity: 'Repairs' }, { time: '12:00', activity: 'Lunch' }, { time: '13:00', activity: 'Inspection' }, { time: '15:00', activity: 'Emergency response' }, { time: '17:00', activity: 'Report' }, { time: '19:00', activity: 'Dinner' }, { time: '20:00', activity: 'Planning' }, { time: '21:00', activity: 'Monitoring' }, { time: '23:00', activity: 'Sleep' }], transactions: [{ id: 't1', type: 'Salary', from: 'Treasury', to: 'Uri', amount: 250, time: '2025-06-01' }], relationships: [{ name: 'Finley', type: 'friend', trust: 80 }, { name: 'Umi', type: 'neutral', trust: 72 }, { name: 'Peyton', type: 'friend', trust: 78 }, { name: 'Gale', type: 'neutral', trust: 65 }, { name: 'Logan', type: 'neutral', trust: 60 }], activities: ['Repaired utility line', 'Inspected sewage plant', 'Responded to gas leak alert', 'Updated maintenance schedule', 'Coordinated with Finley'] },
]

/* ──────────────────────── Constants ──────────────────────── */

const ALL_DISTRICTS: District[] = ['central', 'governance', 'commerce', 'wellness', 'innovation', 'safety', 'legal', 'media', 'residential']

const ALL_ARCHETYPES = ARCHETYPE_NAMES

const ALL_STATUSES = ['online', 'idle', 'offline'] as const

type StatusFilter = 'all' | typeof ALL_STATUSES[number]

const TABS = ['Overview', 'Schedule', 'Wallet', 'Relationships', 'Activity History'] as const

/* ──────────────────────── Helpers ──────────────────────── */

function getStatusColor(s: AgentProfile['status']) {
  switch (s) {
    case 'online': return { bg: 'bg-[#2ECC71]', text: 'text-[#2ECC71]' }
    case 'idle': return { bg: 'bg-[#F39C12]', text: 'text-[#F39C12]' }
    case 'offline': return { bg: 'bg-[#5A5A6A]', text: 'text-[#5A5A6A]' }
  }
}

function getDistrictLabel(d: District) {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

/* ═════════════════════════ Page ═════════════════════════ */

export default function Directory() {
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState<District[]>([])
  const [roleFilter, setRoleFilter] = useState<string[]>([])
  const [archetypeFilter, setArchetypeFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState('name')
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null)
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview')

  const allRoles = useMemo(() => {
    const roles = new Set(AGENTS.map(a => a.role))
    return Array.from(roles).sort()
  }, [])

  const filteredAgents = useMemo(() => {
    let list = [...AGENTS]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      )
    }

    // District
    if (districtFilter.length > 0) {
      list = list.filter(a => districtFilter.includes(a.district))
    }

    // Role
    if (roleFilter.length > 0) {
      list = list.filter(a => roleFilter.includes(a.role))
    }

    // Archetype
    if (archetypeFilter.length > 0) {
      list = list.filter(a => archetypeFilter.includes(a.archetype))
    }

    // Status
    if (statusFilter !== 'all') {
      list = list.filter(a => a.status === statusFilter)
    }

    // Sort
    switch (sortBy) {
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break
      case 'district': list.sort((a, b) => a.district.localeCompare(b.district)); break
      case 'role': list.sort((a, b) => a.role.localeCompare(b.role)); break
      case 'wealth': list.sort((a, b) => b.wallet - a.wallet); break
    }

    // Agent 47 always first when sorting by name
    if (sortBy === 'name') {
      const agent47 = list.find(a => a.isAgent47)
      if (agent47) {
        list = list.filter(a => !a.isAgent47)
        list.unshift(agent47)
      }
    }

    return list
  }, [search, districtFilter, roleFilter, archetypeFilter, statusFilter, sortBy])

  const activeCount = AGENTS.filter(a => a.status === 'online').length
  const idleCount = AGENTS.filter(a => a.status === 'idle').length

  const toggleFilter = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, val: T) => {
      setter(prev => prev.includes(val as any) ? prev.filter(v => v !== val) : [...prev, val as any])
    },
    []
  )

  const clearFilters = useCallback(() => {
    setSearch('')
    setDistrictFilter([])
    setRoleFilter([])
    setArchetypeFilter([])
    setStatusFilter('all')
    setSortBy('name')
  }, [])

  const hasFilters = search || districtFilter.length || roleFilter.length || archetypeFilter.length || statusFilter !== 'all'

  return (
    <div
      className="min-h-[100dvh] relative"
      style={{
        background: 'var(--bg-base)',
        backgroundImage: 'radial-gradient(ellipse at center, rgba(212,175,55,0.15) 0%, transparent 70%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ─── Header ─── */}
      <div className="max-w-[1440px] mx-auto px-6 pt-12 pb-6">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
          className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2"
          style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 30px rgba(212,175,55,0.3)' }}
        >
          Agent Directory
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="text-lg text-[#8A8A9A] mb-4"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          All 47 agents in the simulation — 46 AI citizens + you
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3, ease }}
          className="flex flex-wrap gap-3"
        >
          {[
            { label: '47 Total', color: 'bg-[#00E5FF]/20 text-[#00E5FF]' },
            { label: `${activeCount} Active`, color: 'bg-[#2ECC71]/20 text-[#2ECC71]' },
            { label: `${idleCount} Resting`, color: 'bg-[#5A5A6A]/20 text-[#5A5A6A]' },
            { label: '9 Districts', color: 'bg-[#D4AF37]/20 text-[#D4AF37]' },
          ].map(badge => (
            <span
              key={badge.label}
              className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {badge.label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ─── Filter Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease }}
        className="sticky top-14 z-40 glass-nav border-b border-[#2A2A35] py-3 px-6"
      >
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-grow max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A6A]" />
            <input
              type="text"
              placeholder="Search by name, role, or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-10 pr-8 rounded-lg bg-[#12121A] border border-[#2A2A35] text-sm text-[#F0F0F5] placeholder:text-[#5A5A6A] focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-[#5A5A6A] hover:text-[#F0F0F5]" />
              </button>
            )}
          </div>

          {/* District Filter */}
          <DropdownFilter
            label="District"
            items={ALL_DISTRICTS.map(d => ({ value: d, label: getDistrictLabel(d), color: DISTRICT_COLORS[d] }))}
            selected={districtFilter}
            onToggle={val => toggleFilter(setDistrictFilter, val)}
          />

          {/* Role Filter */}
          <DropdownFilter
            label="Role"
            items={allRoles.map(r => ({ value: r, label: r }))}
            selected={roleFilter}
            onToggle={val => toggleFilter(setRoleFilter, val)}
          />

          {/* Archetype Filter */}
          <DropdownFilter
            label="Archetype"
            items={ALL_ARCHETYPES.map((a, i) => ({ value: a, label: a, color: ARCHETYPE_COLORS[i] }))}
            selected={archetypeFilter}
            onToggle={val => toggleFilter(setArchetypeFilter, val)}
          />

          {/* Status Toggle */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="h-9 px-3 rounded-lg bg-[#12121A] border border-[#2A2A35] text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00E5FF] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="idle">Idle</option>
            <option value="offline">Offline</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#12121A] border border-[#2A2A35] text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00E5FF] cursor-pointer"
          >
            <option value="name">Sort by Name</option>
            <option value="name-desc">Name Z-A</option>
            <option value="district">District</option>
            <option value="role">Role</option>
            <option value="wealth">Wealth (high-low)</option>
          </select>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="h-9 px-3 text-sm text-[#8A8A9A] hover:text-[#F0F0F5] hover:bg-[#1A1A24] rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── Agent Grid ─── */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-[#5A5A6A] mx-auto mb-4" />
            <p className="text-lg text-[#8A8A9A] mb-2">No agents match your filters</p>
            <p className="text-sm text-[#5A5A6A] mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="px-4 py-2 bg-[#D4AF37] text-[#0A0A0F] rounded-lg font-medium text-sm hover:bg-[#F0C94A] transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredAgents.map((agent, i) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  index={i}
                  onClick={() => { setSelectedAgent(agent); setActiveTab('Overview') }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ─── Agent Detail Modal ─── */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentDetailModal
            agent={selectedAgent}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═════════════════════════ Components ═════════════════════════ */

function DropdownFilter<T extends string>({
  label, items, selected, onToggle,
}: {
  label: string
  items: { value: T; label: string; color?: string }[]
  selected: T[]
  onToggle: (val: T) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-3 rounded-lg bg-[#12121A] border border-[#2A2A35] text-sm text-[#F0F0F5] hover:border-[#3A3A48] transition-colors flex items-center gap-2"
      >
        {selected.length > 0 ? `${label} (${selected.length})` : `All ${label}s`}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.2 }}
              style={{ transformOrigin: 'top' }}
              className="absolute top-full mt-1 left-0 z-50 min-w-[180px] bg-[#1A1A24] border border-[#2A2A35] rounded-lg shadow-xl overflow-hidden"
            >
              {items.map(item => (
                <button
                  key={item.value}
                  onClick={() => onToggle(item.value)}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#2A2A35] transition-colors ${
                    selected.includes(item.value) ? 'text-[#F0F0F5]' : 'text-[#8A8A9A]'
                  }`}
                >
                  {item.color && (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {selected.includes(item.value) && <CheckCircle className="w-3.5 h-3.5 text-[#2ECC71]" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function AgentCard({ agent, index, onClick }: { agent: AgentProfile; index: number; onClick: () => void }) {
  const districtColor = DISTRICT_COLORS[agent.district]
  const statusColors = getStatusColor(agent.status)
  const archetypeColor = ARCHETYPE_COLORS[agent.archetypeIdx]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.5), ease }}
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer
        transition-all duration-300
        ${agent.isAgent47
          ? 'bg-gradient-to-b from-[#D4AF37]/10 to-[#12121A] border border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
          : 'bg-[#12121A] border border-[#2A2A35] hover:border-[#3A3A48]'
        }
        hover:-translate-y-1.5 hover:shadow-xl
      `}
      style={{
        boxShadow: agent.isAgent47 ? '0 4px 24px rgba(212,175,55,0.15)' : undefined,
      }}
    >
      {/* Avatar Area */}
      <div className="relative h-36 flex items-center justify-center" style={{
        background: `linear-gradient(180deg, ${districtColor}25 0%, transparent 100%)`,
      }}>
        {/* District Badge */}
        <span
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            backgroundColor: `${districtColor}25`,
            color: districtColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {getDistrictLabel(agent.district)}
        </span>

        {/* Agent 47 Crown */}
        {agent.isAgent47 && (
          <div className="absolute top-2 left-2">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
          </div>
        )}

        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold relative"
          style={{
            backgroundColor: `${districtColor}30`,
            border: `3px solid ${districtColor}`,
            color: districtColor,
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          {agent.name[0]}
          {/* Status Dot */}
          <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#12121A] ${statusColors.bg} ${agent.status === 'online' ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      {/* Info Area */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            #{agent.id.padStart(2, '0')}
          </span>
          {agent.isAgent47 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D4AF37]/20 text-[#D4AF37]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              YOU
            </span>
          )}
        </div>
        <h3 className={`text-sm font-semibold mb-0.5 ${agent.isAgent47 ? 'text-[#D4AF37]' : 'text-[#F0F0F5]'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
          {agent.name}
        </h3>
        <p className="text-xs text-[#8A8A9A] mb-2">{agent.role}</p>

        {/* Archetype Badge */}
        <span
          className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold mb-3"
          style={{
            backgroundColor: `${archetypeColor}20`,
            color: archetypeColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {agent.archetype}
        </span>

        {/* Mini Stats */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#2A2A35]">
          <div className="flex items-center gap-1">
            <Wallet className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-[10px] text-[#D4AF37]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {agent.wallet.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-[#9B59B6]" />
            <span className="text-[10px] text-[#9B59B6]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {agent.reputation}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#00E5FF]" />
            <span className="text-[10px] text-[#00E5FF]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {agent.energy}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Agent Detail Modal ─── */

function AgentDetailModal({ agent, activeTab, onTabChange, onClose }: {
  agent: AgentProfile
  activeTab: (typeof TABS)[number]
  onTabChange: (tab: (typeof TABS)[number]) => void
  onClose: () => void
}) {
  const districtColor = DISTRICT_COLORS[agent.district]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5,5,8,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
        transition={{ duration: 0.35, ease }}
        onClick={(e: MouseEvent) => e.stopPropagation()}
        className="w-full max-w-[720px] max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--gradient-panel)',
          border: '1px solid var(--bg-border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="relative h-28 flex-shrink-0" style={{
          background: `linear-gradient(180deg, ${districtColor}20 0%, transparent 100%)`,
        }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1A1A24]/80 flex items-center justify-center hover:bg-[#2A2A35] transition-colors z-10"
          >
            <X className="w-5 h-5 text-[#8A8A9A]" />
          </button>

          <div className="absolute -bottom-12 left-6 flex items-end gap-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold relative"
              style={{
                backgroundColor: `${districtColor}40`,
                border: `4px solid ${districtColor}`,
                color: districtColor,
                fontFamily: "'Orbitron', sans-serif",
                boxShadow: agent.isAgent47 ? `0 0 30px ${districtColor}60` : undefined,
              }}
            >
              {agent.name[0]}
              {agent.isAgent47 && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-[#D4AF37]" />}
            </div>
          </div>
        </div>

        {/* Name + Quick Info */}
        <div className="pt-14 px-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-xl font-bold ${agent.isAgent47 ? 'text-[#D4AF37]' : 'text-[#F0F0F5]'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Agent #{agent.id}: {agent.name}
            </h2>
            {agent.isAgent47 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                HUMAN IN THE LOOP
              </span>
            )}
          </div>
          <p className="text-sm text-[#8A8A9A] mt-1">{agent.role}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-[#8A8A9A]">
              <MapPin className="w-3 h-3" style={{ color: districtColor }} />
              {getDistrictLabel(agent.district)}
            </span>
            <span className="text-xs text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {agent.did}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-[#2A2A35] flex-shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`
                relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
                ${activeTab === tab ? 'text-[#D4AF37]' : 'text-[#8A8A9A] hover:text-[#F0F0F5]'}
              `}
            >
              {tab}
              {activeTab === tab && (
                <motion.span
                  layoutId="agent-modal-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"
                  style={{ boxShadow: '0 2px 8px rgba(212,175,55,0.4)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'Overview' && <OverviewTab key="overview" agent={agent} />}
            {activeTab === 'Schedule' && <ScheduleTab key="schedule" agent={agent} />}
            {activeTab === 'Wallet' && <WalletTab key="wallet" agent={agent} />}
            {activeTab === 'Relationships' && <RelationshipsTab key="relationships" agent={agent} />}
            {activeTab === 'Activity History' && <ActivityTab key="activity" agent={agent} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Overview Tab ─── */

function OverviewTab({ agent }: { agent: AgentProfile }) {
  const bf = agent.bigFive
  const maxVal = 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Bio */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-[#5A5A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Biography</h4>
        <p className="text-sm text-[#8A8A9A] leading-relaxed">{agent.bio}</p>
      </div>

      {/* Big Five */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-[#5A5A6A] uppercase tracking-wider mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Big Five Personality Traits</h4>
        <div className="space-y-3">
          {([
            { label: 'Openness', value: bf.openness, color: '#9B59B6' },
            { label: 'Conscientiousness', value: bf.conscientiousness, color: '#3498DB' },
            { label: 'Extraversion', value: bf.extraversion, color: '#2ECC71' },
            { label: 'Agreeableness', value: bf.agreeableness, color: '#E67E22' },
            { label: 'Neuroticism', value: bf.neuroticism, color: '#E74C3C' },
          ]).map(trait => (
            <div key={trait.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8A8A9A]">{trait.label}</span>
                <span className="text-[#F0F0F5]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{trait.value}%</span>
              </div>
              <div className="h-2 bg-[#1A1A24] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(trait.value / maxVal) * 100}%` }}
                  transition={{ duration: 0.6, ease }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: trait.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Wallet', value: agent.wallet.toLocaleString(), icon: Wallet, color: '#D4AF37' },
          { label: 'Reputation', value: agent.reputation.toString(), icon: Star, color: '#9B59B6' },
          { label: 'Energy', value: `${agent.energy}%`, icon: Zap, color: '#00E5FF' },
          { label: 'Archetype', value: agent.archetype, icon: PersonStanding, color: ARCHETYPE_COLORS[agent.archetypeIdx] },
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-3 rounded-lg text-center">
            <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
            <div className="text-sm font-bold text-[#F0F0F5]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
            <div className="text-[10px] text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Schedule Tab ─── */

function ScheduleTab({ agent }: { agent: AgentProfile }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h4 className="text-xs font-semibold text-[#5A5A6A] uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Daily Routine</h4>
      <div className="relative pl-6 space-y-0">
        {/* Vertical line */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-[#2A2A35]" />

        {agent.schedule.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="relative flex items-start gap-3 py-2.5"
          >
            {/* Dot */}
            <div className="absolute -left-4 top-3 w-2 h-2 rounded-full bg-[#D4AF37]" />
            <span className="text-xs text-[#D4AF37] w-12 flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {item.time}
            </span>
            <span className="text-sm text-[#8A8A9A]">{item.activity}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Wallet Tab ─── */

function WalletTab({ agent }: { agent: AgentProfile }) {
  const pieData = [
    { name: 'Incoming', value: agent.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0), color: '#2ECC71' },
    { name: 'Outgoing', value: Math.abs(agent.transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)), color: '#E74C3C' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Balance */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-[#D4AF37]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {agent.wallet.toLocaleString()}
        </div>
        <div className="text-xs text-[#5A5A6A] mt-1">x402 credits</div>
      </div>

      {/* Pie Chart */}
      <div className="flex items-center gap-6 mb-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} stroke="none">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A35', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#F0F0F5' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-[#8A8A9A]">{d.name}</span>
              <span className="text-sm text-[#F0F0F5]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <h4 className="text-xs font-semibold text-[#5A5A6A] uppercase tracking-wider mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Recent Transactions</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-[#5A5A6A] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <th className="text-left pb-2 pr-3">ID</th>
              <th className="text-left pb-2 pr-3">Type</th>
              <th className="text-left pb-2 pr-3">From/To</th>
              <th className="text-right pb-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {agent.transactions.map((tx, i) => (
              <tr key={tx.id} className={i % 2 === 0 ? 'bg-[#12121A]/50' : ''}>
                <td className="py-2 pr-3 text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{tx.id}</td>
                <td className="py-2 pr-3 text-[#8A8A9A]">{tx.type}</td>
                <td className="py-2 pr-3 text-[#8A8A9A]">{tx.amount > 0 ? tx.from : tx.to}</td>
                <td className={`py-2 text-right font-medium ${tx.amount > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

/* ─── Relationships Tab ─── */

function RelationshipsTab({ agent }: { agent: AgentProfile }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {agent.relationships.map((rel, i) => {
        const trustColor = rel.trust > 70 ? '#2ECC71' : rel.trust > 40 ? '#F39C12' : '#E74C3C'
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="glass-panel p-4 rounded-lg flex items-center gap-4"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: `${trustColor}30`, color: trustColor, fontFamily: "'Orbitron', sans-serif" }}
            >
              {rel.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#F0F0F5]">{rel.name}</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize"
                  style={{
                    backgroundColor: rel.type === 'friend' ? '#2ECC7120' : rel.type === 'rival' ? '#E74C3C20' : '#5A5A6A20',
                    color: rel.type === 'friend' ? '#2ECC71' : rel.type === 'rival' ? '#E74C3C' : '#8A8A9A',
                  }}
                >
                  {rel.type}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden max-w-[120px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rel.trust}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: trustColor }}
                  />
                </div>
                <span className="text-[10px] text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rel.trust}%</span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/* ─── Activity Tab ─── */

function ActivityTab({ agent }: { agent: AgentProfile }) {
  const activityIcons = [
    Briefcase, Calendar, Heart, Users, TrendingUp, Star, Zap, MapPin,
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-2"
    >
      {agent.activities.map((activity, i) => {
        const Icon = activityIcons[i % activityIcons.length]
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[#1A1A24] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1A1A24] flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-[#5A5A6A]" />
            </div>
            <span className="text-sm text-[#8A8A9A]">{activity}</span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
