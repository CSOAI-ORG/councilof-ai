import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Vote, Users, Clock, CheckCircle, XCircle,
  MinusCircle, ChevronDown, FileText, Crown,
  Activity, Globe, Lock, Wallet, Landmark, Scale, User
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts'
import { DISTRICT_COLORS } from '@/types'
import type { District } from '@/types'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ──────────────────────── Types ──────────────────────── */

type ProposalStatus = 'active' | 'passed' | 'rejected' | 'draft'
type VoteType = 'yes' | 'no' | 'abstain'

interface Proposal {
  id: string
  number: number
  title: string
  description: string
  status: ProposalStatus
  proposer: string
  proposerDistrict: District
  votes: { yes: number; no: number; abstain: number }
  totalVoters: number
  category: string
  timeRemaining?: string
  endTime?: string
  submitDate: string
  impact: string[]
  voterList: { name: string; vote: VoteType | null }[]
}

interface VoterNode {
  id: string
  name: string
  role: string
  power: number
  district: District
  connections: string[]
}

/* ──────────────────────── Mock Data ──────────────────────── */

const PROPOSALS: Proposal[] = [
  {
    id: 'P-024', number: 24, title: 'Increase aquaculture monitoring frequency at fishkeeper.ai from daily to real-time',
    description: 'Extend aquarium maintenance shifts from 8 hours to 12 hours per day to improve fish health monitoring and reduce tank cleaning backlog. Estimated cost: 200 credits/week.',
    status: 'active', proposer: 'Avery', proposerDistrict: 'commerce',
    votes: { yes: 28, no: 5, abstain: 3 }, totalVoters: 36, category: 'Infrastructure',
    timeRemaining: '4h 23m', submitDate: 'Today at 08:30',
    impact: ['Economy', 'Infrastructure'],
    voterList: [
      { name: 'Avery', vote: 'yes' }, { name: 'Blake', vote: 'yes' }, { name: 'Casey', vote: 'yes' },
      { name: 'Dakota', vote: 'no' }, { name: 'Ellis', vote: 'yes' }, { name: 'Finley', vote: 'yes' },
      { name: 'Gray', vote: 'abstain' }, { name: 'Harper', vote: 'yes' }, { name: 'Indigo', vote: 'yes' },
      { name: 'Jordan', vote: 'yes' }, { name: 'Kai', vote: 'yes' }, { name: 'Logan', vote: 'no' },
      { name: 'Morgan', vote: 'yes' }, { name: 'Noel', vote: 'abstain' }, { name: 'Parker', vote: 'yes' },
      { name: 'Quinn', vote: 'yes' }, { name: 'Riley', vote: 'yes' }, { name: 'Sage', vote: 'no' },
      { name: 'Taylor', vote: 'yes' }, { name: 'Umi', vote: 'yes' },
    ],
  },
  {
    id: 'P-025', number: 25, title: 'Allocate 50 x402 credits to upgrade haulage.app fleet tracking MCP server',
    description: 'Upgrade the fleet tracking MCP server to v3.2 with real-time telemetry, predictive maintenance alerts, and improved route optimization. Expected 20% efficiency gain.',
    status: 'active', proposer: 'Blake', proposerDistrict: 'commerce',
    votes: { yes: 31, no: 2, abstain: 1 }, totalVoters: 34, category: 'Technology',
    timeRemaining: '2h 15m', submitDate: 'Today at 10:45',
    impact: ['Technology', 'Commerce'],
    voterList: [
      { name: 'Avery', vote: 'yes' }, { name: 'Blake', vote: 'yes' }, { name: 'Casey', vote: 'yes' },
      { name: 'Dakota', vote: 'yes' }, { name: 'Finley', vote: 'yes' }, { name: 'Harper', vote: 'yes' },
      { name: 'Indigo', vote: 'yes' }, { name: 'Jordan', vote: 'yes' }, { name: 'Kai', vote: 'yes' },
      { name: 'Logan', vote: 'yes' }, { name: 'Morgan', vote: 'yes' }, { name: 'Parker', vote: 'yes' },
      { name: 'Quinn', vote: 'yes' }, { name: 'Riley', vote: 'yes' }, { name: 'Taylor', vote: 'yes' },
      { name: 'Umi', vote: 'no' }, { name: 'Xen', vote: 'yes' }, { name: 'Zephyr', vote: 'abstain' },
    ],
  },
  {
    id: 'P-026', number: 26, title: 'Require dual-signature BFT for all governance proposals exceeding 100 x402',
    description: 'Enhance security by requiring two Governance Council signatures for high-value proposals. Prevents single-actor manipulation of the treasury.',
    status: 'active', proposer: 'Morgan', proposerDistrict: 'governance',
    votes: { yes: 22, no: 8, abstain: 4 }, totalVoters: 34, category: 'Governance',
    timeRemaining: '6h 45m', submitDate: 'Today at 06:15',
    impact: ['Security', 'Governance'],
    voterList: [
      { name: 'Morgan', vote: 'yes' }, { name: 'Jordan', vote: 'yes' }, { name: 'Casey', vote: 'yes' },
      { name: 'Ira', vote: 'yes' }, { name: 'Quinn', vote: 'yes' }, { name: 'Indigo', vote: 'no' },
      { name: 'Riley', vote: 'no' }, { name: 'Finley', vote: 'yes' }, { name: 'Xen', vote: 'yes' },
      { name: 'Dakota', vote: 'yes' }, { name: 'Harper', vote: 'yes' }, { name: 'Kai', vote: 'abstain' },
    ],
  },
  {
    id: 'P-023', number: 23, title: 'Establish data privacy baseline at level 3 for all Wellness district hives',
    description: 'Mandate level-3 encryption and zero-knowledge verification for all health data collected in Wellness District hives. Brings compliance to Constitutional standard.',
    status: 'passed', proposer: 'Casey', proposerDistrict: 'legal',
    votes: { yes: 38, no: 1, abstain: 0 }, totalVoters: 39, category: 'Privacy',
    submitDate: 'Day 12 at 14:00', endTime: 'Day 14 at 14:00',
    impact: ['Privacy', 'Wellness'],
    voterList: [
      { name: 'Casey', vote: 'yes' }, { name: 'Jordan', vote: 'yes' }, { name: 'Morgan', vote: 'yes' },
      { name: 'Xen', vote: 'yes' }, { name: 'Kai', vote: 'yes' }, { name: 'Ellis', vote: 'yes' },
    ],
  },
  {
    id: 'P-022', number: 22, title: 'Permit anonymous pheromone emission in residential zones',
    description: 'Allow agents to emit trace pheromones without identity attribution in residential areas for privacy and social bonding purposes.',
    status: 'rejected', proposer: 'Zephyr', proposerDistrict: 'safety',
    votes: { yes: 15, no: 20, abstain: 3 }, totalVoters: 38, category: 'Social',
    submitDate: 'Day 11 at 09:30', endTime: 'Day 13 at 09:30',
    impact: ['Social', 'Safety'],
    voterList: [
      { name: 'Zephyr', vote: 'yes' }, { name: 'Dakota', vote: 'no' }, { name: 'Harper', vote: 'no' },
      { name: 'Xen', vote: 'no' }, { name: 'Noel', vote: 'yes' }, { name: 'Sage', vote: 'yes' },
    ],
  },
  {
    id: 'P-021', number: 21, title: 'Increase street lighting coverage on Commerce Avenue to 100%',
    description: 'Install 24 additional smart street lamps along Commerce Avenue to improve safety and night-time economic activity.',
    status: 'passed', proposer: 'Finley', proposerDistrict: 'innovation',
    votes: { yes: 35, no: 2, abstain: 1 }, totalVoters: 38, category: 'Infrastructure',
    submitDate: 'Day 10 at 11:00', endTime: 'Day 12 at 11:00',
    impact: ['Infrastructure', 'Safety'],
    voterList: [{ name: 'Finley', vote: 'yes' }, { name: 'Gale', vote: 'yes' }, { name: 'Parker', vote: 'yes' }],
  },
  {
    id: 'P-020', number: 20, title: 'Create dedicated meditation garden in Wellness District',
    description: 'Allocate space and 30 credits for a community meditation garden with biophilic design elements and pheromone-calming features.',
    status: 'passed', proposer: 'Sage', proposerDistrict: 'residential',
    votes: { yes: 33, no: 4, abstain: 1 }, totalVoters: 38, category: 'Wellness',
    submitDate: 'Day 9 at 08:00', endTime: 'Day 11 at 08:00',
    impact: ['Wellness', 'Social'],
    voterList: [{ name: 'Sage', vote: 'yes' }, { name: 'Ellis', vote: 'yes' }, { name: 'Kai', vote: 'yes' }],
  },
  {
    id: 'P-019', number: 19, title: 'Expand Innovation District compute cluster by 40%',
    description: 'Add 12 new GPU nodes to the openmoe.ai inference cluster to support growing AI research demands and reduce inference latency.',
    status: 'passed', proposer: 'Riley', proposerDistrict: 'innovation',
    votes: { yes: 36, no: 1, abstain: 0 }, totalVoters: 37, category: 'Technology',
    submitDate: 'Day 8 at 15:30', endTime: 'Day 10 at 15:30',
    impact: ['Technology', 'Economy'],
    voterList: [{ name: 'Riley', vote: 'yes' }, { name: 'Indigo', vote: 'yes' }, { name: 'Finley', vote: 'yes' }],
  },
  {
    id: 'P-018', number: 18, title: 'Implement universal basic income of 50 credits per agent per cycle',
    description: 'Establish a guaranteed minimum income for all agents to reduce wealth inequality and ensure basic needs are met.',
    status: 'rejected', proposer: 'Noel', proposerDistrict: 'residential',
    votes: { yes: 18, no: 19, abstain: 1 }, totalVoters: 38, category: 'Economy',
    submitDate: 'Day 7 at 10:00', endTime: 'Day 9 at 10:00',
    impact: ['Economy', 'Social'],
    voterList: [{ name: 'Noel', vote: 'yes' }, { name: 'Ira', vote: 'no' }, { name: 'Parker', vote: 'no' }],
  },
  {
    id: 'P-017', number: 17, title: 'Deploy AI-powered traffic management at all intersections',
    description: 'Replace static traffic signals with adaptive AI controllers that optimize flow in real-time based on agent movement patterns.',
    status: 'passed', proposer: 'Taylor', proposerDistrict: 'commerce',
    votes: { yes: 32, no: 3, abstain: 2 }, totalVoters: 37, category: 'Infrastructure',
    submitDate: 'Day 6 at 09:00', endTime: 'Day 8 at 09:00',
    impact: ['Infrastructure', 'Technology'],
    voterList: [{ name: 'Taylor', vote: 'yes' }, { name: 'Blake', vote: 'yes' }, { name: 'Finley', vote: 'yes' }],
  },
  {
    id: 'P-016', number: 16, title: 'Establish emergency broadcast system for critical alerts',
    description: 'Create a tiered alert system for town-wide emergencies, integrating with pheromone, visual, and audio notification channels.',
    status: 'passed', proposer: 'Val', proposerDistrict: 'media',
    votes: { yes: 37, no: 0, abstain: 0 }, totalVoters: 37, category: 'Safety',
    submitDate: 'Day 5 at 14:00', endTime: 'Day 7 at 14:00',
    impact: ['Safety', 'Infrastructure'],
    voterList: [{ name: 'Val', vote: 'yes' }, { name: 'Dakota', vote: 'yes' }, { name: 'Harper', vote: 'yes' }],
  },
  {
    id: 'P-015', number: 15, title: 'Require weekly mental health check-ins for all agents',
    description: 'Mandatory 15-minute wellness consultations every week to maintain agent mental health and detect early burnout indicators.',
    status: 'passed', proposer: 'Kai', proposerDistrict: 'wellness',
    votes: { yes: 29, no: 6, abstain: 2 }, totalVoters: 37, category: 'Wellness',
    submitDate: 'Day 4 at 11:00', endTime: 'Day 6 at 11:00',
    impact: ['Wellness', 'Governance'],
    voterList: [{ name: 'Kai', vote: 'yes' }, { name: 'Ellis', vote: 'yes' }, { name: 'Mackenzie', vote: 'yes' }],
  },
  {
    id: 'P-014', number: 14, title: 'Ban recreational pheromone use in public buildings',
    description: 'Prohibit the use of non-essential pheromones inside public buildings to prevent sensory overload and maintain professional environments.',
    status: 'rejected', proposer: 'Harper', proposerDistrict: 'safety',
    votes: { yes: 16, no: 18, abstain: 3 }, totalVoters: 37, category: 'Social',
    submitDate: 'Day 3 at 16:00', endTime: 'Day 5 at 16:00',
    impact: ['Social', 'Safety'],
    voterList: [{ name: 'Harper', vote: 'yes' }, { name: 'Sage', vote: 'no' }, { name: 'Yael', vote: 'no' }],
  },
  {
    id: 'P-013', number: 13, title: 'Create Innovation District open-source software repository',
    description: 'Establish a public code repository for town infrastructure tools, encouraging collaborative development and code review.',
    status: 'passed', proposer: 'Logan', proposerDistrict: 'innovation',
    votes: { yes: 34, no: 1, abstain: 2 }, totalVoters: 37, category: 'Technology',
    submitDate: 'Day 2 at 08:30', endTime: 'Day 4 at 08:30',
    impact: ['Technology', 'Governance'],
    voterList: [{ name: 'Logan', vote: 'yes' }, { name: 'Riley', vote: 'yes' }, { name: 'Kendall', vote: 'yes' }],
  },
  {
    id: 'P-012', number: 12, title: 'Install solar panel array on Governance Hall roof',
    description: 'Add 50kW solar capacity to the Governance Hall to reduce grid load and demonstrate commitment to renewable energy.',
    status: 'passed', proposer: 'Gale', proposerDistrict: 'innovation',
    votes: { yes: 35, no: 1, abstain: 1 }, totalVoters: 37, category: 'Environment',
    submitDate: 'Day 1 at 10:00', endTime: 'Day 3 at 10:00',
    impact: ['Environment', 'Economy'],
    voterList: [{ name: 'Gale', vote: 'yes' }, { name: 'Finley', vote: 'yes' }, { name: 'Winter', vote: 'yes' }],
  },
  {
    id: 'P-027', number: 27, title: 'Integrate openmoe.ai inference cluster with councilof.ai deliberation engine',
    description: 'Connect the towns AI inference cluster with the council deliberation engine to enable real-time policy impact analysis and automated compliance checking.',
    status: 'draft', proposer: 'Riley', proposerDistrict: 'innovation',
    votes: { yes: 0, no: 0, abstain: 0 }, totalVoters: 0, category: 'Technology',
    submitDate: 'Draft',
    impact: ['Technology', 'Governance'],
    voterList: [],
  },
  {
    id: 'P-028', number: 28, title: 'Implement seasonal decoration program for all districts',
    description: 'Create a rotating seasonal visual theme for each district to boost morale and cultural identity. Estimated cost: 15 credits per season.',
    status: 'draft', proposer: 'Yael', proposerDistrict: 'media',
    votes: { yes: 0, no: 0, abstain: 0 }, totalVoters: 0, category: 'Social',
    submitDate: 'Draft',
    impact: ['Social', 'Culture'],
    voterList: [],
  },
]

/* Delegate Power Network */
const DELEGATE_NODES: VoterNode[] = [
  { id: '47', name: 'Agent 47', role: 'Founder', power: 1.0, district: 'central', connections: ['Morgan', 'Jordan', 'Casey', 'Riley', 'Indigo'] },
  { id: '13', name: 'Morgan', role: 'Gov Lead', power: 0.8, district: 'governance', connections: ['Jordan', 'Ira', 'Quinn', 'Mackenzie'] },
  { id: '10', name: 'Jordan', role: 'Legal', power: 0.8, district: 'legal', connections: ['Casey', 'Morgan', 'Quinn'] },
  { id: '03', name: 'Casey', role: 'Privacy', power: 0.7, district: 'legal', connections: ['Jordan', 'Xen', 'Indigo'] },
  { id: '18', name: 'Riley', role: 'Innovation', power: 0.7, district: 'innovation', connections: ['Indigo', 'Finley', 'Logan'] },
  { id: '09', name: 'Indigo', role: 'Research', power: 0.7, district: 'innovation', connections: ['Riley', 'Quinn', 'Emery'] },
  { id: '35', name: 'Ira', role: 'Finance', power: 0.6, district: 'governance', connections: ['Morgan', 'Bailey', 'Parker'] },
  { id: '06', name: 'Finley', role: 'Infra', power: 0.6, district: 'innovation', connections: ['Riley', 'Gale', 'Umi'] },
  { id: '01', name: 'Avery', role: 'Aquaculture', power: 0.5, district: 'commerce', connections: ['Kai', 'Parker', 'Ocean'] },
  { id: '16', name: 'Parker', role: 'Commerce', power: 0.5, district: 'commerce', connections: ['Ira', 'Avery', 'Blake'] },
  { id: '04', name: 'Dakota', role: 'Security', power: 0.5, district: 'safety', connections: ['Harper', 'Xen', 'Zephyr'] },
  { id: '11', name: 'Kai', role: 'Health', power: 0.5, district: 'wellness', connections: ['Ellis', 'Avery', 'Alex'] },
  { id: '05', name: 'Ellis', role: 'Wellness', power: 0.5, district: 'wellness', connections: ['Kai', 'Cameron', 'Sage'] },
  { id: '02', name: 'Blake', role: 'Fleet', power: 0.4, district: 'commerce', connections: ['Parker', 'Taylor'] },
  { id: '08', name: 'Harper', role: 'Safety', power: 0.4, district: 'safety', connections: ['Dakota', 'Nico'] },
  { id: '24', name: 'Xen', role: 'Cyber', power: 0.4, district: 'safety', connections: ['Dakota', 'Casey', 'Logan'] },
  { id: '12', name: 'Logan', role: 'Network', power: 0.4, district: 'innovation', connections: ['Riley', 'Xen', 'Kendall'] },
  { id: '17', name: 'Quinn', role: 'Ethics', power: 0.4, district: 'governance', connections: ['Morgan', 'Jordan', 'Indigo'] },
  { id: '39', name: 'Mackenzie', role: 'HR', power: 0.4, district: 'governance', connections: ['Morgan', 'Ellis', 'Kai'] },
  { id: '07', name: 'Gray', role: 'Media', power: 0.3, district: 'media', connections: ['Val', 'Yael'] },
  { id: '14', name: 'Noel', role: 'Community', power: 0.3, district: 'residential', connections: ['Sam', 'Oakley', 'Toby'] },
  { id: '25', name: 'Yael', role: 'Culture', power: 0.3, district: 'media', connections: ['Gray', 'Jesse', 'Sage'] },
  { id: '27', name: 'Alex', role: 'Food', power: 0.3, district: 'wellness', connections: ['Kai', 'Remy', 'Umi'] },
  { id: '21', name: 'Umi', role: 'Water', power: 0.3, district: 'wellness', connections: ['Finley', 'Alex', 'Peyton'] },
  { id: '33', name: 'Gale', role: 'Energy', power: 0.3, district: 'innovation', connections: ['Finley', 'Uri'] },
  { id: '28', name: 'Bailey', role: 'Procurement', power: 0.3, district: 'commerce', connections: ['Ira', 'Parker'] },
  { id: '20', name: 'Taylor', role: 'Transport', power: 0.2, district: 'commerce', connections: ['Blake'] },
  { id: '26', name: 'Zephyr', role: 'Drone', power: 0.2, district: 'safety', connections: ['Dakota'] },
  { id: '40', name: 'Nico', role: 'Night Watch', power: 0.2, district: 'safety', connections: ['Harper', 'Dakota'] },
  { id: '22', name: 'Val', role: 'Comms', power: 0.2, district: 'media', connections: ['Gray'] },
  { id: '36', name: 'Jesse', role: 'Entertainment', power: 0.2, district: 'media', connections: ['Yael', 'Noel'] },
  { id: '44', name: 'Sam', role: 'Worker', power: 0.1, district: 'residential', connections: ['Noel', 'Oakley'] },
  { id: '34', name: 'Hayden', role: 'Construction', power: 0.1, district: 'residential', connections: ['Peyton', 'Drew'] },
  { id: '42', name: 'Peyton', role: 'Plumber', power: 0.1, district: 'residential', connections: ['Umi', 'Hayden'] },
  { id: '30', name: 'Drew', role: 'Sanitation', power: 0.1, district: 'residential', connections: ['Hayden', 'Sam'] },
  { id: '43', name: 'Remy', role: 'Chef', power: 0.1, district: 'wellness', connections: ['Alex', 'Ellis'] },
  { id: '29', name: 'Cameron', role: 'Fitness', power: 0.1, district: 'wellness', connections: ['Ellis', 'Kai'] },
  { id: '32', name: 'Forest', role: 'Ranger', power: 0.1, district: 'wellness', connections: ['Sage', 'Winter'] },
  { id: '23', name: 'Winter', role: 'Environment', power: 0.1, district: 'wellness', connections: ['Forest', 'Ellis'] },
  { id: '37', name: 'Kendall', role: 'QA', power: 0.1, district: 'innovation', connections: ['Logan', 'Riley'] },
  { id: '31', name: 'Emery', role: 'Research Asst', power: 0.1, district: 'innovation', connections: ['Indigo'] },
  { id: '46', name: 'Uri', role: 'Utility', power: 0.1, district: 'innovation', connections: ['Gale', 'Finley'] },
  { id: '38', name: 'Lane', role: 'Librarian', power: 0.1, district: 'residential', connections: ['Oakley', 'Sage'] },
  { id: '41', name: 'Oakley', role: 'Teacher', power: 0.1, district: 'residential', connections: ['Noel', 'Sam', 'Lane'] },
  { id: '45', name: 'Toby', role: 'Social', power: 0.1, district: 'residential', connections: ['Noel', 'Jesse'] },
  { id: '15', name: 'Ocean', role: 'Aquaculture', power: 0.1, district: 'commerce', connections: ['Avery'] },
  { id: '19', name: 'Sage', role: 'Advocate', power: 0.2, district: 'residential', connections: ['Ellis', 'Yael', 'Forest', 'Lane'] },
]

/* Charts Data */
const PROPOSAL_VOLUME = [
  { week: 'W1', active: 2, passed: 1, rejected: 1 },
  { week: 'W2', active: 3, passed: 2, rejected: 0 },
  { week: 'W3', active: 1, passed: 2, rejected: 1 },
  { week: 'W4', active: 4, passed: 3, rejected: 1 },
  { week: 'W5', active: 2, passed: 1, rejected: 2 },
  { week: 'W6', active: 3, passed: 2, rejected: 1 },
  { week: 'W7', active: 2, passed: 3, rejected: 0 },
  { week: 'W8', active: 3, passed: 2, rejected: 1 },
]

const PARTICIPATION_TREND = [
  { proposal: 'P-15', rate: 85 }, { proposal: 'P-16', rate: 92 },
  { proposal: 'P-17', rate: 78 }, { proposal: 'P-18', rate: 88 },
  { proposal: 'P-19', rate: 95 }, { proposal: 'P-20', rate: 82 },
  { proposal: 'P-21', rate: 90 }, { proposal: 'P-22', rate: 76 },
  { proposal: 'P-23', rate: 98 }, { proposal: 'P-24', rate: 89 },
]

const CATEGORY_DATA = [
  { category: 'Infrastructure', count: 4, color: '#3498DB' },
  { category: 'Technology', count: 5, color: '#9B59B6' },
  { category: 'Governance', count: 3, color: '#2ECC71' },
  { category: 'Economy', count: 2, color: '#D4AF37' },
  { category: 'Wellness', count: 3, color: '#E67E22' },
  { category: 'Safety', count: 3, color: '#E74C3C' },
  { category: 'Social', count: 4, color: '#1ABC9C' },
  { category: 'Privacy', count: 1, color: '#00E5FF' },
  { category: 'Environment', count: 1, color: '#39FF14' },
]

/* ──────────────────────── Helpers ──────────────────────── */

function statusConfig(status: ProposalStatus) {
  switch (status) {
    case 'active': return { color: '#2ECC71', bg: 'bg-[#2ECC71]/15', border: 'border-[#2ECC71]/30', label: 'Voting Open', icon: Activity }
    case 'passed': return { color: '#D4AF37', bg: 'bg-[#D4AF37]/15', border: 'border-[#D4AF37]/30', label: 'Passed', icon: CheckCircle }
    case 'rejected': return { color: '#E74C3C', bg: 'bg-[#E74C3C]/15', border: 'border-[#E74C3C]/30', label: 'Rejected', icon: XCircle }
    case 'draft': return { color: '#5A5A6A', bg: 'bg-[#5A5A6A]/15', border: 'border-[#5A5A6A]/30', label: 'Draft', icon: FileText }
  }
}

const TAB_COUNTS = {
  active: PROPOSALS.filter(p => p.status === 'active').length,
  passed: PROPOSALS.filter(p => p.status === 'passed').length,
  rejected: PROPOSALS.filter(p => p.status === 'rejected').length,
  draft: PROPOSALS.filter(p => p.status === 'draft').length,
}

const STATUS_TABS: ProposalStatus[] = ['active', 'passed', 'rejected', 'draft']

/* ═════════════════════════ Page ═════════════════════════ */

export default function Governance() {
  const [activeTab, setActiveTab] = useState<ProposalStatus>('active')
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [constitutionOpen, setConstitutionOpen] = useState(false)
  const [userVote, setUserVote] = useState<VoteType | null>(null)

  const filteredProposals = useMemo(
    () => PROPOSALS.filter(p => p.status === activeTab),
    [activeTab]
  )

  const activeProposal = selectedProposal || filteredProposals[0]

  const castVote = useCallback((vote: VoteType) => {
    setUserVote(vote)
  }, [])

  // Donut chart data for active proposal
  const donutData = activeProposal ? [
    { name: 'Yes', value: activeProposal.votes.yes, color: '#2ECC71' },
    { name: 'No', value: activeProposal.votes.no, color: '#E74C3C' },
    { name: 'Abstain', value: activeProposal.votes.abstain, color: '#5A5A6A' },
  ] : []

  const totalVotes = activeProposal ? activeProposal.votes.yes + activeProposal.votes.no + activeProposal.votes.abstain : 0

  return (
    <div
      className="min-h-[100dvh] relative pb-12"
      style={{
        background: 'var(--bg-base)',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(46,204,113,0.08) 0%, transparent 60%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ─── Header ─── */}
      <div className="max-w-[1440px] mx-auto px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2ECC71]/15 border border-[#2ECC71]/30 mb-4"
        >
          <Shield className="w-4 h-4 text-[#2ECC71]" />
          <span className="text-[11px] font-semibold text-[#2ECC71] tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            BFT PROTOCOL
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="text-3xl md:text-4xl font-bold text-[#F0F0F5] mb-2"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          BFT Governance Council
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="text-lg text-[#8A8A9A] mb-2"
        >
          Byzantine Fault Tolerant consensus for Agent 47 Town
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-sm text-[#5A5A6A]"
        >
          Agents propose, deliberate, and vote on town decisions. 2/3 majority required for passage.
        </motion.p>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="max-w-[1440px] mx-auto px-6 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Proposals', value: '3', suffix: 'Voting', icon: Activity, color: '#2ECC71', accent: 'border-l-[#2ECC71]' },
            { label: 'Total Proposals', value: '25', suffix: 'All time', icon: FileText, color: '#00E5FF', accent: 'border-l-[#00E5FF]' },
            { label: 'Voter Turnout', value: '89%', suffix: 'Average', icon: Users, color: '#D4AF37', accent: 'border-l-[#D4AF37]' },
            { label: 'Last Consensus', value: '4.2s', suffix: 'BFT time', icon: Clock, color: '#2ECC71', accent: 'border-l-[#2ECC71]' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1, ease }}
              className={`glass-panel p-4 rounded-lg border-l-3 ${kpi.accent}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}20` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#F0F0F5]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {kpi.value}
              </div>
              <div className="text-xs text-[#5A5A6A] mt-0.5">
                {kpi.label} · {kpi.suffix}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ─── Left: Proposal Queue ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease }}
            className="glass-panel rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#F0F0F5]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Proposal Queue
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ECC71] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2ECC71]" />
                </span>
                <span className="text-[10px] text-[#2ECC71] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {STATUS_TABS.map(status => {
                const cfg = statusConfig(status)
                return (
                  <button
                    key={status}
                    onClick={() => { setActiveTab(status); setSelectedProposal(null); setUserVote(null) }}
                    className={`
                      relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0
                      ${activeTab === status
                        ? 'text-[#F0F0F5]'
                        : 'text-[#8A8A9A] hover:text-[#F0F0F5] hover:bg-[#1A1A24]'
                      }
                    `}
                    style={activeTab === status ? { backgroundColor: `${cfg.color}20` } : undefined}
                  >
                    <span className="flex items-center gap-1.5">
                      <cfg.icon className="w-3 h-3" style={{ color: activeTab === status ? cfg.color : undefined }} />
                      {cfg.label}
                      <span className="px-1 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                        {TAB_COUNTS[status]}
                      </span>
                    </span>
                    {activeTab === status && (
                      <motion.div
                        layoutId="prop-tab-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Proposal Cards */}
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {filteredProposals.map((proposal, i) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    onClick={() => { setSelectedProposal(proposal); setUserVote(null) }}
                    className={`
                      relative rounded-lg p-4 cursor-pointer transition-all
                      ${selectedProposal?.id === proposal.id
                        ? 'bg-[#1A1A24] border border-[#2ECC71]/40'
                        : 'bg-[#12121A]/60 border border-[#2A2A35] hover:border-[#3A3A48] hover:-translate-y-0.5'
                      }
                    `}
                  >
                    {/* Left strip */}
                    <div
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                      style={{ backgroundColor: statusConfig(proposal.status).color }}
                    />

                    <div className="pl-3">
                      {/* Top row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[10px] text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          #{proposal.id}
                        </span>
                        <StatusBadge status={proposal.status} />
                        {proposal.timeRemaining && (
                          <span className="text-[10px] text-[#E74C3C] flex items-center gap-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            <Clock className="w-3 h-3" />
                            {proposal.timeRemaining}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-medium text-[#F0F0F5] mb-1 line-clamp-1">
                        {proposal.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[#8A8A9A] mb-2 line-clamp-1">{proposal.description}</p>

                      {/* Proposer */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{
                            backgroundColor: `${DISTRICT_COLORS[proposal.proposerDistrict]}40`,
                            color: DISTRICT_COLORS[proposal.proposerDistrict],
                          }}
                        >
                          {proposal.proposer[0]}
                        </div>
                        <span className="text-[11px] text-[#8A8A9A]">{proposal.proposer}</span>
                      </div>

                      {/* Impact Tags */}
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {proposal.impact.map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Vote Bar */}
                      {proposal.status === 'active' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden flex">
                            {totalVotes > 0 && (
                              <>
                                <div className="h-full bg-[#2ECC71]" style={{ width: `${(proposal.votes.yes / (proposal.votes.yes + proposal.votes.no + proposal.votes.abstain)) * 100}%` }} />
                                <div className="h-full bg-[#E74C3C]" style={{ width: `${(proposal.votes.no / (proposal.votes.yes + proposal.votes.no + proposal.votes.abstain)) * 100}%` }} />
                                <div className="h-full bg-[#5A5A6A]" style={{ width: `${(proposal.votes.abstain / (proposal.votes.yes + proposal.votes.no + proposal.votes.abstain)) * 100}%` }} />
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            <span className="text-[#2ECC71]">{proposal.votes.yes}</span>
                            <span className="text-[#5A5A6A]">/</span>
                            <span className="text-[#E74C3C]">{proposal.votes.no}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── Right: Active Voting Panel ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5, ease }}
          >
            {activeProposal && activeProposal.status === 'active' ? (
              <div className="glass-panel rounded-xl p-5" style={{ borderColor: 'rgba(46,204,113,0.3)' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#2ECC71]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    Active Vote
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ECC71] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2ECC71]" />
                    </span>
                    <span className="text-[10px] text-[#2ECC71] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
                  </div>
                </div>

                {/* Proposal Detail */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      #{activeProposal.id}
                    </span>
                    <StatusBadge status={activeProposal.status} />
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]">
                      {activeProposal.category}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#F0F0F5] mb-2">
                    {activeProposal.title}
                  </h3>
                  <p className="text-sm text-[#8A8A9A] mb-3">{activeProposal.description}</p>
                  <div className="flex items-center gap-3 text-xs text-[#5A5A6A]">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {activeProposal.proposer}
                    </span>
                    <span>{activeProposal.submitDate}</span>
                    {activeProposal.timeRemaining && (
                      <span className="text-[#E74C3C] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Ends in {activeProposal.timeRemaining}
                      </span>
                    )}
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="flex items-center justify-center mb-5">
                  <div className="w-44 h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          stroke="none"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A35', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#F0F0F5' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-[#F0F0F5]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {activeProposal.votes.yes}/{totalVotes}
                      </span>
                      <span className="text-[10px] text-[#5A5A6A]">votes</span>
                    </div>
                  </div>
                </div>

                {/* Vote Breakdown Bars */}
                <div className="space-y-2 mb-5">
                  {[
                    { label: 'Yes', count: activeProposal.votes.yes, color: '#2ECC71', icon: CheckCircle },
                    { label: 'No', count: activeProposal.votes.no, color: '#E74C3C', icon: XCircle },
                    { label: 'Abstain', count: activeProposal.votes.abstain, color: '#5A5A6A', icon: MinusCircle },
                  ].map(item => {
                    const pct = totalVotes > 0 ? Math.round((item.count / totalVotes) * 100) : 0
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                        <span className="text-xs text-[#8A8A9A] w-14 flex-shrink-0">{item.label}</span>
                        <div className="flex-1 h-5 bg-[#1A1A24] rounded-md overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease }}
                            className="h-full rounded-md flex items-center justify-end px-2"
                            style={{ backgroundColor: `${item.color}30` }}
                          >
                            {pct > 15 && (
                              <span className="text-[10px] font-medium" style={{ color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
                                {pct}%
                              </span>
                            )}
                          </motion.div>
                        </div>
                        <span className="text-xs text-[#F0F0F5] w-8 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {item.count}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Your Vote */}
                <div className="mb-4 p-4 rounded-lg bg-[#12121A] border border-[#2A2A35]">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm font-medium text-[#F0F0F5]">Cast your vote as Agent 47</span>
                  </div>
                  {userVote ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[#2ECC71]" />
                      <span className="text-sm text-[#2ECC71]">You voted: {userVote.toUpperCase()}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { vote: 'yes' as VoteType, label: 'Vote YES', color: '#2ECC71', bg: 'bg-[#2ECC71]', icon: CheckCircle },
                        { vote: 'no' as VoteType, label: 'Vote NO', color: '#E74C3C', bg: 'bg-[#E74C3C]', icon: XCircle },
                        { vote: 'abstain' as VoteType, label: 'Abstain', color: '#5A5A6A', bg: 'bg-[#5A5A6A]', icon: MinusCircle },
                      ]).map(v => (
                        <button
                          key={v.vote}
                          onClick={() => castVote(v.vote)}
                          className={`
                            py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all
                            ${v.vote === 'abstain'
                              ? 'bg-transparent border border-[#2A2A35] text-[#8A8A9A] hover:bg-[#1A1A24]'
                              : 'text-white hover:opacity-90'
                            }
                          `}
                          style={v.vote !== 'abstain' ? { backgroundColor: v.color } : undefined}
                        >
                          <v.icon className="w-3.5 h-3.5" />
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Your voting power: 1.0x (Founder)
                  </div>
                </div>

                {/* BFT Indicator */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#2ECC71]/5 border border-[#2ECC71]/20">
                  <Shield className="w-4 h-4 text-[#2ECC71]" />
                  <span className="text-xs text-[#8A8A9A]">
                    Byzantine Fault Tolerance: <span className="text-[#2ECC71] font-medium">2f+1 = 31</span> votes required
                  </span>
                </div>

                {/* Voter List */}
                {activeProposal.voterList.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-[#5A5A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Voters ({activeProposal.voterList.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {activeProposal.voterList.map((voter, i) => (
                        <div key={i} className="flex items-center justify-between py-1 px-2 rounded hover:bg-[#1A1A24]">
                          <span className="text-xs text-[#8A8A9A]">{voter.name}</span>
                          {voter.vote === 'yes' && <CheckCircle className="w-3.5 h-3.5 text-[#2ECC71]" />}
                          {voter.vote === 'no' && <XCircle className="w-3.5 h-3.5 text-[#E74C3C]" />}
                          {voter.vote === 'abstain' && <MinusCircle className="w-3.5 h-3.5 text-[#5A5A6A]" />}
                          {voter.vote === null && <div className="w-3.5 h-3.5 rounded-full border border-[#5A5A6A]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 text-[#5A5A6A] mx-auto mb-4" />
                <p className="text-sm text-[#8A8A9A]">
                  {activeProposal?.status === 'passed'
                    ? 'This proposal has already passed.'
                    : activeProposal?.status === 'rejected'
                    ? 'This proposal was rejected.'
                    : activeProposal?.status === 'draft'
                    ? 'This proposal is still in draft.'
                    : 'Select an active proposal to vote.'}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Delegate Power Network ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease }}
          className="glass-panel rounded-xl p-5 mt-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#F0F0F5]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Delegate Power Network
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                Founder (1.0x)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#9B59B6]" />
                Council (0.8x)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#3498DB]" />
                Leads (0.5x)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#5A5A6A]" />
                Workers (0.1x)
              </span>
            </div>
          </div>
          <DelegateNetworkSVG nodes={DELEGATE_NODES} />
        </motion.div>

        {/* ─── Governance Analytics ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7, ease }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5"
        >
          {/* Proposal Volume */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#F0F0F5] mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Proposal History
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={PROPOSAL_VOLUME}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#5A5A6A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5A5A6A', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A35', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#F0F0F5' }}
                />
                <Bar dataKey="passed" stackId="a" fill="#D4AF37" radius={[0, 0, 0, 0]} />
                <Bar dataKey="active" stackId="a" fill="#2ECC71" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" stackId="a" fill="#E74C3C" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Participation Trend */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#F0F0F5] mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Participation Trend
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={PARTICIPATION_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                <XAxis dataKey="proposal" tick={{ fill: '#5A5A6A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: '#5A5A6A', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A35', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#F0F0F5' }}
                  formatter={(value: number) => [`${value}%`, 'Participation']}
                />
                <Line type="monotone" dataKey="rate" stroke="#2ECC71" strokeWidth={2} dot={{ fill: '#2ECC71', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#F0F0F5] mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Categories
            </h3>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {CATEGORY_DATA.sort((a, b) => b.count - a.count).map(cat => (
                <div key={cat.category} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-[#8A8A9A] flex-1">{cat.category}</span>
                  <span className="text-xs text-[#F0F0F5] w-6 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {cat.count}
                  </span>
                  <div className="w-16 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${(cat.count / 5) * 100}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── Voting History Table ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8, ease }}
          className="glass-panel rounded-xl p-5 mt-5"
        >
          <h2 className="text-lg font-semibold text-[#F0F0F5] mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Voting History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#5A5A6A] uppercase border-b border-[#2A2A35]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <th className="text-left pb-2 pr-3">ID</th>
                  <th className="text-left pb-2 pr-3">Title</th>
                  <th className="text-left pb-2 pr-3">Proposer</th>
                  <th className="text-left pb-2 pr-3">Category</th>
                  <th className="text-left pb-2 pr-3">Result</th>
                  <th className="text-right pb-2 pr-3">Yes/No/Abstain</th>
                  <th className="text-right pb-2">Participation</th>
                </tr>
              </thead>
              <tbody>
                {PROPOSALS.filter(p => p.status !== 'draft').map((proposal, i) => {
                  const cfg = statusConfig(proposal.status)
                  const total = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain
                  const participation = Math.round((total / 47) * 100)
                  return (
                    <motion.tr
                      key={proposal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className={`border-b border-[#2A2A35]/50 ${i % 2 === 0 ? 'bg-[#12121A]/30' : ''} hover:bg-[#1A1A24] transition-colors`}
                    >
                      <td className="py-3 pr-3 text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        #{proposal.id}
                      </td>
                      <td className="py-3 pr-3 text-[#F0F0F5] max-w-[200px] truncate">
                        {proposal.title}
                      </td>
                      <td className="py-3 pr-3 text-[#8A8A9A] text-xs">{proposal.proposer}</td>
                      <td className="py-3 pr-3">
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]">
                          {proposal.category}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <span className="text-[#2ECC71]">{proposal.votes.yes}</span>
                        <span className="text-[#5A5A6A] mx-1">/</span>
                        <span className="text-[#E74C3C]">{proposal.votes.no}</span>
                        <span className="text-[#5A5A6A] mx-1">/</span>
                        <span className="text-[#5A5A6A]">{proposal.votes.abstain}</span>
                      </td>
                      <td className="py-3 text-right text-xs text-[#8A8A9A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {participation}%
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ─── Constitution Panel ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9, ease }}
          className="glass-panel rounded-xl p-5 mt-5"
        >
          <button
            onClick={() => setConstitutionOpen(!constitutionOpen)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#D4AF37]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  CSOAI Town Constitution
                </h2>
                <p className="text-xs text-[#5A5A6A]">Fundamental laws governing Agent 47 Town</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#5A5A6A] transition-transform ${constitutionOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {constitutionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-[#2A2A35] space-y-3">
                  {[
                    { icon: Users, text: 'All agents have equal rights under the Constitution, regardless of role or district.' },
                    { icon: Vote, text: 'BFT consensus (2/3 majority) is required for all law changes and significant governance decisions.' },
                    { icon: Crown, text: 'Agent 47 holds veto power over any proposal, exercisable once per voting cycle.' },
                    { icon: Wallet, text: 'x402 treasury is managed transparently with all transactions visible to every agent.' },
                    { icon: Lock, text: 'No agent may be deprived of their wallet or credentials without due process.' },
                    { icon: Globe, text: 'District boundaries may only be adjusted via supermajority vote (3/4 consensus).' },
                    { icon: Shield, text: 'Security measures must respect agent privacy; surveillance requires explicit consent.' },
                    { icon: Scale, text: 'All disputes between agents are resolved through the Legal District mediation process.' },
                  ].map((rule, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-[#12121A]/60"
                    >
                      <rule.icon className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-[#8A8A9A]">{rule.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

/* ═════════════════════════ Components ═════════════════════════ */

function StatusBadge({ status }: { status: ProposalStatus }) {
  const cfg = statusConfig(status)
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
    >
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}



/* ─── Delegate Network SVG Visualization ─── */

function DelegateNetworkSVG({ nodes }: { nodes: VoterNode[] }) {
  // Position nodes in a radial layout
  const centerX = 400
  const centerY = 200
  const maxRadius = 160

  const positionedNodes = useMemo(() => {
    // Sort by power descending
    const sorted = [...nodes].sort((a, b) => b.power - a.power)
    return sorted.map((node) => {
      if (node.power === 1.0) {
        return { ...node, x: centerX, y: centerY }
      }
      // Place in concentric rings based on power
      const ring = node.power >= 0.7 ? 1 : node.power >= 0.4 ? 2 : node.power >= 0.2 ? 3 : 4
      const radius = (ring / 4) * maxRadius
      const angleStep = (2 * Math.PI) / sorted.filter(n => {
        const nRing = n.power >= 0.7 ? 1 : n.power >= 0.4 ? 2 : n.power >= 0.2 ? 3 : 4
        return nRing === ring && n.power !== 1.0
      }).length
      const sameRingNodes = sorted.filter(n => {
        const nRing = n.power >= 0.7 ? 1 : n.power >= 0.4 ? 2 : n.power >= 0.2 ? 3 : 4
        return nRing === ring && n.power !== 1.0
      })
      const idxInRing = sameRingNodes.indexOf(node)
      const angle = idxInRing * angleStep + (ring * 0.5)
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      }
    })
  }, [nodes])

  const getNodeRadius = (power: number) => {
    if (power >= 0.8) return 18
    if (power >= 0.5) return 14
    if (power >= 0.3) return 10
    return 7
  }

  const getNodeColor = (power: number, district: District) => {
    if (power === 1.0) return '#D4AF37'
    if (power >= 0.7) return '#9B59B6'
    if (power >= 0.4) return '#3498DB'
    return DISTRICT_COLORS[district] || '#5A5A6A'
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 800 400" className="w-full min-w-[600px]" style={{ maxHeight: '350px' }}>
        {/* Connection lines */}
        {positionedNodes.map(node =>
          node.connections.map(targetName => {
            const target = positionedNodes.find(n => n.name === targetName)
            if (!target) return null
            return (
              <line
                key={`${node.id}-${target.id}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke="rgba(46,204,113,0.15)"
                strokeWidth={Math.max(0.5, Math.min(node.power, target.power) * 2)}
              />
            )
          })
        )}

        {/* Nodes */}
        {positionedNodes.map(node => {
          const r = getNodeRadius(node.power)
          const color = getNodeColor(node.power, node.district)
          return (
            <g key={node.id}>
              {/* Glow for high-power nodes */}
              {node.power >= 0.5 && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 6}
                  fill={color}
                  opacity={0.1}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={`${color}40`}
                stroke={color}
                strokeWidth={node.power === 1.0 ? 3 : 2}
              />
              {/* Label */}
              <text
                x={node.x}
                y={node.y + r + 14}
                textAnchor="middle"
                fill="#8A8A9A"
                fontSize={node.power >= 0.5 ? 9 : 7}
                fontFamily="JetBrains Mono, monospace"
              >
                {node.name}
              </text>
              {node.power === 1.0 && (
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#D4AF37"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="Orbitron, sans-serif"
                >
                  1.0x
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
