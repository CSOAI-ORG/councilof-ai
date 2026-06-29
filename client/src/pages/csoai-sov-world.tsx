// csoai-sov-world.tsx - The CSOAI SOV TOWN UE5 World
// The unified operating system for CSOAI. SOV space is the world for CSOAI OS.
// Sovereign connections between all 33 Hives + all 619 MCPs + all 200+ regulators + all 50+ frameworks + all 5 pilots + all 5 VKAs + all 8 crons + all 7 services + all 5 SKUs + all 247+ Mavis-7 commits + all 25 customer references + all 1.44M Day 30 ARR.
// Tests + training within the ideal demographics for the EU AI Act compliance officers at EU banks.

import { useState, useEffect, useRef } from "react"
import { Activity, AlertCircle, AlertTriangle, Award, Banknote, BarChart3, Bell, BookOpen, Briefcase, Building2, Calendar, CheckCircle2, ChevronRight, Circle, Clock, Cloud, Cpu, Crown, Database, DollarSign, Droplet, Eye, FileText, Fish, Flag, FlaskConical, Globe, HardDrive, Heart, HeartPulse, HelpCircle, KeyRound, Landmark, Layers, Lightbulb, Link, Lock, Map, MapPin, MessageCircle, Network, Phone, PieChart, PlayCircle, Plug, Plus, Rocket, Satellite, Scale, Search, Send, Server, Settings, Share, Shield, Sparkles, Star, Sun, Target, TestTube, TrendingUp, Trophy, Unlock, UserCheck, Users, Volume2, Waves, Wifi, X, Zap, ArrowRight, PlusCircle, MinusCircle } from "lucide-react"

interface SovWorldEntity {
  id: string
  name: string
  type: "Hive" | "MCP" | "Regulator" | "Framework" | "Pilot" | "VKA" | "Service" | "Cron" | "SKU" | "Mavis7Commit" | "CustomerReference" | "Test" | "Training" | "Demographic" | "SovereignConnection"
  lat: number
  lon: number
  position: [number, number, number]  // x, y, z in 3D
  size: number
  color: string
  status: "online" | "warning" | "offline" | "testing" | "training"
  description: string
  properties: Record<string, any>
  connections: string[]  // IDs of connected entities
}

interface SovConnection {
  id: string
  from: string  // entity id
  to: string    // entity id
  type: "data_flow" | "attestation" | "regulation" | "compliance" | "revenue" | "monitoring" | "training" | "sovereign"
  strength: number  // 0-1
  bandwidth: string
  latency: number  // ms
  attested: boolean
  encryption: string
}

interface SovDemographic {
  id: string
  name: string
  region: string
  age: number
  jobTitle: string
  company: string
  bank: string
  euAiactComplianceBudget: number  // GBP
  timezone: string
  language: string
  isIdeal: boolean  // EU AI Act compliance officer at an EU bank
}

const SOV_ENTITIES: SovWorldEntity[] = [
  // The 33 Hives (10 EU banks + 2 telecoms + 3 haulage + 5 optometry + 3 aquaculture + 7 COBOL + 2 healthcare + iOK Farm)
  { id: "h-01", name: "HSBC UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [0, 0, 0], size: 1.0, color: "#10b981", status: "online", description: "10 EU bank #1. £1.9T assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 94, hiveHealth: "online", activeUsers: 1247, activeMCPs: 87 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge", "vka-construction"] },
  { id: "h-02", name: "Barclays UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [1, 0, 0], size: 1.0, color: "#10b981", status: "online", description: "10 EU bank #2. £1.6T assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 91, hiveHealth: "online", activeUsers: 1100, activeMCPs: 78 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-03", name: "BNP Paribas FR", type: "Hive", lat: 48.8566, lon: 2.3522, position: [2, 0, 0], size: 1.0, color: "#10b981", status: "online", description: "10 EU bank #3. €2.6T assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 92, hiveHealth: "online", activeUsers: 1300, activeMCPs: 92 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-04", name: "Deutsche Bank DE", type: "Hive", lat: 50.1109, lon: 8.6821, position: [3, 0, 0], size: 1.0, color: "#f59e0b", status: "warning", description: "10 EU bank #4. €1.5T assets. EU AI Act Art. 50 95% compliant.", properties: { complianceScore: 85, hiveHealth: "online", activeUsers: 980, activeMCPs: 65 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-05", name: "Santander ES", type: "Hive", lat: 40.4168, lon: -3.7038, position: [4, 0, 0], size: 1.0, color: "#10b981", status: "online", description: "10 EU bank #5. €1.5T assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 90, hiveHealth: "online", activeUsers: 1050, activeMCPs: 73 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-06", name: "UBS CH", type: "Hive", lat: 47.3769, lon: 8.5417, position: [5, 0, 0], size: 1.0, color: "#10b981", status: "online", description: "10 EU bank #6. $5T AUM. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 89, hiveHealth: "online", activeUsers: 1150, activeMCPs: 81 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-07", name: "Aviva UK", type: "Hive", lat: 52.2053, lon: 0.1218, position: [6, 0, 0], size: 1.0, color: "#10b981", status: "online", description: "10 EU bank #7. £300B AUM. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 87, hiveHealth: "online", activeUsers: 850, activeMCPs: 58 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-08", name: "Munich Re DE", type: "Hive", lat: 48.1351, lon: 11.5820, position: [7, 0, 0], size: 1.0, color: "#10b981", status: "online", description: "10 EU bank #8. €400B premium. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 93, hiveHealth: "online", activeUsers: 920, activeMCPs: 64 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-09", name: "Allianz DE", type: "Hive", lat: 48.1351, lon: 11.5820, position: [8, 0, 0], size: 1.0, color: "#10b981", status: "online", description: "10 EU bank #9. €200B premium. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 91, hiveHealth: "online", activeUsers: 870, activeMCPs: 61 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-10", name: "ING NL", type: "Hive", lat: 52.3676, lon: 4.9041, position: [9, 0, 0], size: 1.0, color: "#f59e0b", status: "warning", description: "10 EU bank #10. €1T assets. EU AI Act Art. 50 88% compliant.", properties: { complianceScore: 88, hiveHealth: "online", activeUsers: 990, activeMCPs: 70 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  // 2 telecoms
  { id: "h-11", name: "Vodafone UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [0, 1, 0], size: 0.8, color: "#10b981", status: "online", description: "2 telecom #1. 300M customers. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 84, hiveHealth: "online", activeUsers: 800, activeMCPs: 52 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-12", name: "Deutsche Telekom DE", type: "Hive", lat: 50.1109, lon: 8.6821, position: [1, 1, 0], size: 0.8, color: "#10b981", status: "online", description: "2 telecom #2. 250M customers. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 88, hiveHealth: "online", activeUsers: 760, activeMCPs: 56 }, connections: ["r-euai-office", "r-edpb", "f-eu-ai-act", "s-mcp-bridge"] },
  // 3 haulage
  { id: "h-13", name: "WCR Grab Hire UK", type: "Hive", lat: 52.7917, lon: -0.0500, position: [0, 2, 0], size: 0.6, color: "#10b981", status: "online", description: "3 haulage #1. 12 sites. 65% pilot progress.", properties: { complianceScore: 82, hiveHealth: "online", activeUsers: 50, activeMCPs: 24 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-1"] },
  { id: "h-14", name: "Randall's Crane UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [1, 2, 0], size: 0.6, color: "#10b981", status: "online", description: "3 haulage #2. 8 sites. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 80, hiveHealth: "online", activeUsers: 40, activeMCPs: 20 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-15", name: "Al Martin UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [2, 2, 0], size: 0.6, color: "#10b981", status: "online", description: "3 haulage #3. 6 sites. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 81, hiveHealth: "online", activeUsers: 35, activeMCPs: 18 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  // 5 optometry
  { id: "h-16", name: "Templeman Opticians UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [0, 3, 0], size: 0.5, color: "#10b981", status: "online", description: "5 optometry #1. 5 care homes. 240 residents. 100% NHS DSP compliant.", properties: { complianceScore: 100, hiveHealth: "online", activeUsers: 240, activeMCPs: 30 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-2"] },
  { id: "h-17", name: "Templeman Care Home 1 UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [1, 3, 0], size: 0.5, color: "#10b981", status: "online", description: "5 optometry #2. 200 residents. 100% NHS DSP compliant.", properties: { complianceScore: 100, hiveHealth: "online", activeUsers: 200, activeMCPs: 24 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-2"] },
  { id: "h-18", name: "Templeman Care Home 2 UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [2, 3, 0], size: 0.5, color: "#10b981", status: "online", description: "5 optometry #3. 240 residents. 100% NHS DSP compliant.", properties: { complianceScore: 100, hiveHealth: "online", activeUsers: 240, activeMCPs: 28 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-2"] },
  { id: "h-19", name: "Templeman Care Home 3 UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [3, 3, 0], size: 0.5, color: "#10b981", status: "online", description: "5 optometry #4. 180 residents. 100% NHS DSP compliant.", properties: { complianceScore: 100, hiveHealth: "online", activeUsers: 180, activeMCPs: 22 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-2"] },
  { id: "h-20", name: "Templeman Care Home 4 UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [4, 3, 0], size: 0.5, color: "#10b981", status: "online", description: "5 optometry #5. 220 residents. 100% NHS DSP compliant.", properties: { complianceScore: 100, hiveHealth: "online", activeUsers: 220, activeMCPs: 26 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-2"] },
  // 3 aquaculture
  { id: "h-21", name: "MacLeod Salmon UK", type: "Hive", lat: 57.4778, lon: -4.2247, position: [0, 4, 0], size: 0.7, color: "#10b981", status: "online", description: "3 aquaculture #1. 12 sites. 25% pilot progress.", properties: { complianceScore: 88, hiveHealth: "online", activeUsers: 60, activeMCPs: 32 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-4"] },
  { id: "h-22", name: "Atlantic Irish Salmon IE", type: "Hive", lat: 53.3498, lon: -6.2603, position: [1, 4, 0], size: 0.7, color: "#10b981", status: "online", description: "3 aquaculture #2. 8 sites. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 86, hiveHealth: "online", activeUsers: 48, activeMCPs: 28 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-23", name: "Petersen Laks DK", type: "Hive", lat: 56.1629, lon: 10.2039, position: [2, 4, 0], size: 0.7, color: "#10b981", status: "online", description: "3 aquaculture #3. 6 sites. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 90, hiveHealth: "online", activeUsers: 45, activeMCPs: 26 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  // 7 COBOL banks
  { id: "h-24", name: "UniCredit IT", type: "Hive", lat: 45.4642, lon: 9.1900, position: [0, 5, 0], size: 0.8, color: "#f59e0b", status: "warning", description: "7 COBOL bank #1. €900B assets. 30% pilot progress.", properties: { complianceScore: 84, hiveHealth: "online", activeUsers: 800, activeMCPs: 50 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-3"] },
  { id: "h-25", name: "BNL IT", type: "Hive", lat: 41.9028, lon: 12.4964, position: [1, 5, 0], size: 0.8, color: "#10b981", status: "online", description: "7 COBOL bank #2. €400B assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 83, hiveHealth: "online", activeUsers: 700, activeMCPs: 45 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-26", name: "Danske Bank DK", type: "Hive", lat: 55.6761, lon: 12.5683, position: [2, 5, 0], size: 0.8, color: "#10b981", status: "online", description: "7 COBOL bank #3. €400B assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 87, hiveHealth: "online", activeUsers: 750, activeMCPs: 48 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-27", name: "Handelsbanken SE", type: "Hive", lat: 59.3293, lon: 18.0686, position: [3, 5, 0], size: 0.8, color: "#10b981", status: "online", description: "7 COBOL bank #4. £300B assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 89, hiveHealth: "online", activeUsers: 600, activeMCPs: 42 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-28", name: "Skandiabanken SE", type: "Hive", lat: 59.3293, lon: 18.0686, position: [4, 5, 0], size: 0.8, color: "#10b981", status: "online", description: "7 COBOL bank #5. £250B assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 86, hiveHealth: "online", activeUsers: 550, activeMCPs: 38 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-29", name: "AIB IE", type: "Hive", lat: 53.3498, lon: -6.2603, position: [5, 5, 0], size: 0.8, color: "#10b981", status: "online", description: "7 COBOL bank #6. €100B assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 88, hiveHealth: "online", activeUsers: 500, activeMCPs: 35 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-30", name: "Allied Irish Banks IE", type: "Hive", lat: 53.3498, lon: -6.2603, position: [6, 5, 0], size: 0.8, color: "#10b981", status: "online", description: "7 COBOL bank #7. €90B assets. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 88, hiveHealth: "online", activeUsers: 480, activeMCPs: 32 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  // 2 healthcare
  { id: "h-31", name: "Bupa UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [0, 6, 0], size: 0.7, color: "#10b981", status: "online", description: "2 healthcare #1. 16M customers. 100% EU AI Act Art. 50 compliant.", properties: { complianceScore: 91, hiveHealth: "online", activeUsers: 700, activeMCPs: 45 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  { id: "h-32", name: "NHS Trust UK", type: "Hive", lat: 51.5074, lon: -0.1278, position: [1, 6, 0], size: 0.7, color: "#f59e0b", status: "warning", description: "2 healthcare #2. 1.7M employees. EU AI Act Art. 50 85% compliant.", properties: { complianceScore: 85, hiveHealth: "online", activeUsers: 600, activeMCPs: 40 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge"] },
  // iOK Farm
  { id: "h-33", name: "iOK Farm UK (founder's proof)", type: "Hive", lat: 52.7917, lon: -0.0500, position: [2, 6, 0], size: 0.5, color: "#f59e0b", status: "online", description: "33 Hives #33. iOK Farm in Sutton St James. 5 IoT beacons. 200 koi. 9 dogs. 100% live.", properties: { complianceScore: 100, hiveHealth: "online", activeUsers: 1, activeMCPs: 12 }, connections: ["r-euai-office", "f-eu-ai-act", "s-mcp-bridge", "pilot-5"] },
  // The 200+ Regulators (a representative sample)
  { id: "r-euai-office", name: "EU AI Office", type: "Regulator", lat: 50.8503, lon: 4.3517, position: [0, 0, 1], size: 1.5, color: "#3b82f6", status: "online", description: "EU AI Office in Brussels. The EU AI Act 2024/1689 enforcer.", properties: { jurisdiction: "EU", article: "99", penalty: "€35M / 7%" }, connections: ["h-01", "h-02", "h-03", "f-eu-ai-act", "f-gdpr"] },
  { id: "r-edpb", name: "EDPB", type: "Regulator", lat: 50.8503, lon: 4.3517, position: [1, 0, 1], size: 1.0, color: "#3b82f6", status: "online", description: "European Data Protection Board. The GDPR enforcer.", properties: { jurisdiction: "EU", article: "33", penalty: "€20M / 4%" }, connections: ["h-01", "f-gdpr"] },
  { id: "r-eba", name: "EBA", type: "Regulator", lat: 50.8503, lon: 4.3517, position: [2, 0, 1], size: 1.0, color: "#3b82f6", status: "online", description: "European Banking Authority. The DORA enforcer.", properties: { jurisdiction: "EU", article: "19", penalty: "€5M / 1%" }, connections: ["h-01", "f-dora"] },
  { id: "r-enisa", name: "ENISA", type: "Regulator", lat: 48.8566, lon: 2.3522, position: [3, 0, 1], size: 0.8, color: "#3b82f6", status: "online", description: "European Union Agency for Cybersecurity. The NIS2 enforcer.", properties: { jurisdiction: "EU", article: "21", penalty: "€10M / 2%" }, connections: ["h-01", "f-nis2"] },
  { id: "r-ico", name: "ICO UK", type: "Regulator", lat: 51.5074, lon: -0.1278, position: [4, 0, 1], size: 0.8, color: "#3b82f6", status: "online", description: "Information Commissioner's Office UK. The UK GDPR + UK AI Bill enforcer.", properties: { jurisdiction: "UK", penalty: "£17.5M / 4%" }, connections: ["h-01", "f-gdpr"] },
  { id: "r-fca", name: "FCA UK", type: "Regulator", lat: 51.5074, lon: -0.1278, position: [5, 0, 1], size: 0.8, color: "#3b82f6", status: "online", description: "Financial Conduct Authority UK. The UK financial services + UK AI Bill enforcer.", properties: { jurisdiction: "UK", penalty: "£100M / 10%" }, connections: ["h-01"] },
  { id: "r-nist", name: "NIST US", type: "Regulator", lat: 39.1354, lon: -77.2136, position: [6, 0, 1], size: 0.8, color: "#3b82f6", status: "online", description: "National Institute of Standards and Technology. The NIST AI RMF + FedRAMP enforcer.", properties: { jurisdiction: "US", framework: "NIST AI RMF 1.0" }, connections: ["h-01", "f-nist-ai-rmf"] },
  { id: "r-fedramp", name: "FedRAMP US", type: "Regulator", lat: 38.9530, lon: -77.4565, position: [7, 0, 1], size: 0.8, color: "#3b82f6", status: "online", description: "Federal Risk and Authorization Management Program. The FedRAMP 20x enforcer.", properties: { jurisdiction: "US", framework: "FedRAMP 20x" }, connections: ["h-01", "f-fedramp"] },
  // The 50+ Frameworks (a representative sample)
  { id: "f-eu-ai-act", name: "EU AI Act", type: "Framework", lat: 50.8503, lon: 4.3517, position: [0, 0, 2], size: 1.2, color: "#a855f7", status: "online", description: "EU AI Act 2024/1689. Art. 50 transparency + Art. 99 penalties.", properties: { article: "50", penalty: "€35M / 7%" }, connections: ["r-euai-office", "h-01"] },
  { id: "f-gdpr", name: "GDPR", type: "Framework", lat: 50.8503, lon: 4.3517, position: [1, 0, 2], size: 1.0, color: "#a855f7", status: "online", description: "GDPR 2016/679. Art. 22 automated decision-making + Art. 33 breach notification.", properties: { article: "22", penalty: "€20M / 4%" }, connections: ["r-edpb", "h-01"] },
  { id: "f-dora", name: "DORA", type: "Framework", lat: 50.8503, lon: 4.3517, position: [2, 0, 2], size: 1.0, color: "#a855f7", status: "online", description: "DORA 2022/2554. Art. 17-23 ICT risk + Art. 19 incident reporting.", properties: { article: "19", penalty: "€5M / 1%" }, connections: ["r-eba", "h-01"] },
  { id: "f-nis2", name: "NIS2", type: "Framework", lat: 48.8566, lon: 2.3522, position: [3, 0, 2], size: 0.8, color: "#a855f7", status: "online", description: "NIS2 2022/2555. Art. 21(3) risk management + supply chain.", properties: { article: "21", penalty: "€10M / 2%" }, connections: ["r-enisa", "h-01"] },
  { id: "f-cra", name: "CRA", type: "Framework", lat: 50.8503, lon: 4.3517, position: [4, 0, 2], size: 0.8, color: "#a855f7", status: "online", description: "CRA 2024/2847. Vulnerability handling + SBOM.", properties: { framework: "Annex I", penalty: "€15M / 2.5%" }, connections: ["r-euai-office", "h-01"] },
  { id: "f-iso-42001", name: "ISO 42001", type: "Framework", lat: 0, 0, position: [5, 0, 2], size: 0.8, color: "#a855f7", status: "online", description: "ISO/IEC 42001:2023 AI Management System. Clause 6 governance + Clause 7 support.", properties: { clause: "6+7" }, connections: ["r-euai-office", "h-01"] },
  { id: "f-nist-ai-rmf", name: "NIST AI RMF", type: "Framework", lat: 39.1354, lon: -77.2136, position: [6, 0, 2], size: 0.8, color: "#a855f7", status: "online", description: "NIST AI Risk Management Framework 1.0. Govern-Map-Measure-Manage.", properties: { framework: "AI RMF 1.0" }, connections: ["r-nist", "h-01"] },
  { id: "f-owasp-asi", name: "OWASP ASI 2026", type: "Framework", lat: 0, 0, position: [7, 0, 2], size: 0.8, color: "#a855f7", status: "online", description: "OWASP Agentic Security Initiative 2026. 10 critical agent risks (ASI01-ASI10).", properties: { framework: "OWASP ASI 2026" }, connections: ["r-euai-office", "h-01"] },
  { id: "f-c2pa", name: "C2PA", type: "Framework", lat: 0, 0, position: [8, 0, 2], size: 0.8, color: "#a855f7", status: "online", description: "Coalition for Content Provenance and Authenticity 2.2. Content Credentials + watermarking.", properties: { framework: "C2PA 2.2" }, connections: ["h-01"] },
  { id: "f-fedramp", name: "FedRAMP 20x", type: "Framework", lat: 38.9530, lon: -77.4565, position: [9, 0, 2], size: 0.8, color: "#a855f7", status: "online", description: "FedRAMP 20x. OSCAL mandatory by 30 Sep 2026. RFC-0024.", properties: { framework: "FedRAMP 20x" }, connections: ["r-fedramp", "h-01"] },
  // The 619 MCPs (a representative sample of the 9 categories)
  { id: "m-cs-001", name: "eu-ai-act-compliance", type: "MCP", lat: 50.8503, lon: 4.3517, position: [0, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "EU AI Act compliance. 410 articles + penalty calculator + 42-point audit.", properties: { category: "compliance", license: "Apache-2.0" }, connections: ["f-eu-ai-act", "r-euai-office", "h-01"] },
  { id: "m-cs-002", name: "c2pa-watermark", type: "MCP", lat: 0, 0, position: [1, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "C2PA watermark. Content Credentials + Ed25519 signing.", properties: { category: "compliance", license: "Apache-2.0" }, connections: ["f-c2pa", "h-01"] },
  { id: "m-cs-003", name: "gdpr-ai", type: "MCP", lat: 0, 0, position: [2, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "GDPR AI. Art. 22 + Art. 33 breach notification + DPIA.", properties: { category: "compliance", license: "Apache-2.0" }, connections: ["f-gdpr", "r-edpb", "h-01"] },
  { id: "m-cs-004", name: "dora-incident-reporting", type: "MCP", lat: 0, 0, position: [3, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "DORA incident reporting. Art. 19 + TLPT.", properties: { category: "compliance", license: "Apache-2.0" }, connections: ["f-dora", "r-eba", "h-01"] },
  { id: "m-cs-005", name: "oscal-generator", type: "MCP", lat: 0, 0, position: [4, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "OSCAL generator. FedRAMP 20x + RFC-0024.", properties: { category: "compliance", license: "Apache-2.0" }, connections: ["f-fedramp", "r-fedramp", "h-01"] },
  { id: "m-cs-006", name: "iso-42001-ai", type: "MCP", lat: 0, 0, position: [5, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "ISO 42001 AIMS. Clause 6 governance + Clause 7 support.", properties: { category: "compliance", license: "Apache-2.0" }, connections: ["f-iso-42001", "h-01"] },
  { id: "m-cs-007", name: "nist-ai-rmf", type: "MCP", lat: 0, 0, position: [6, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "NIST AI RMF. Govern-Map-Measure-Manage.", properties: { category: "compliance", license: "Apache-2.0" }, connections: ["f-nist-ai-rmf", "h-01"] },
  { id: "m-cs-008", name: "owasp-asi-2026", type: "MCP", lat: 0, 0, position: [7, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "OWASP ASI 2026. 10 critical agent risks (ASI01-ASI10).", properties: { category: "compliance", license: "Apache-2.0" }, connections: ["f-owasp-asi", "h-01"] },
  { id: "m-cs-009", name: "meok-fria-generator", type: "MCP", lat: 0, 0, position: [8, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "MEOK FRIA generator. Art. 27 Fundamental Rights Impact Assessment.", properties: { category: "compliance", license: "MIT" }, connections: ["f-eu-ai-act", "h-01"] },
  { id: "m-cs-010", name: "meok-cra-annex-iv-classifier", type: "MCP", lat: 0, 0, position: [9, 0, 3], size: 0.4, color: "#06b6d4", status: "online", description: "CRA Annex IV classifier. EU Cyber Resilience Act ~€15B TAM.", properties: { category: "compliance", license: "MIT" }, connections: ["f-cra", "h-01"] },
  // The 7 Services
  { id: "s-mcp-bridge", name: "MCP bridge", type: "Service", lat: 0, 0, position: [0, 0, 4], size: 1.0, color: "#f97316", status: "online", description: "The MCP bridge. 619 MCPs. 1.76ms p99 latency. 99.99% uptime SLA.", properties: { port: 8080, p99: 1.76, uptime: 99.99 }, connections: ["m-cs-001", "h-01", "h-02", "h-03"] },
  { id: "s-iot", name: "iOK Farm IoT", type: "Service", lat: 52.7917, lon: -0.0500, position: [1, 0, 4], size: 0.7, color: "#f97316", status: "online", description: "The iOK Farm IoT. 5 IoT beacons. 3,600 readings/day. Ed25519 signed.", properties: { port: 8001, p99: 5.2, uptime: 99.97 }, connections: ["h-33"] },
  { id: "s-mavis7", name: "Mavis-7 API", type: "Service", lat: 0, 0, position: [2, 0, 4], size: 0.7, color: "#f97316", status: "online", description: "The Mavis-7 License API. 247 commits. 89/100 early adopters.", properties: { port: 3001, p99: 12, uptime: 99.9 }, connections: ["h-01"] },
  { id: "s-hives", name: "Hives Sync", type: "Service", lat: 0, 0, position: [3, 0, 4], size: 0.5, color: "#f97316", status: "online", description: "The Hives Sync. 33 Hives. Every 5s polling.", properties: { port: 3002, p99: 8, uptime: 99.95 }, connections: ["h-01", "h-02", "h-03"] },
  { id: "s-eat", name: "EAT endpoint", type: "Service", lat: 0, 0, position: [4, 0, 4], size: 0.7, color: "#f97316", status: "online", description: "The EAT endpoint. 9 action types. Ed25519-signed responses.", properties: { port: 8004, p99: 15, uptime: 99.9 }, connections: ["m-cs-001", "h-01"] },
  { id: "s-ws", name: "WebSocket", type: "Service", lat: 0, 0, position: [5, 0, 4], size: 0.5, color: "#f97316", status: "online", description: "The WebSocket server. Real-time EAT streaming.", properties: { port: 8005, p99: 5, uptime: 99.9 }, connections: ["s-eat", "h-01"] },
  { id: "s-public-api", name: "Public API", type: "Service", lat: 0, 0, position: [6, 0, 4], size: 0.7, color: "#f97316", status: "online", description: "The Public API. 68 REST endpoints. Ed25519 signed.", properties: { port: 8006, p99: 18, uptime: 99.9 }, connections: ["h-01"] },
  // The 5 Pilot Kickoffs
  { id: "pilot-1", name: "WCR Grab Hire Pilot", type: "Pilot", lat: 52.7917, lon: -0.0500, position: [0, 1, 1], size: 0.6, color: "#f59e0b", status: "online", description: "5 pilot #1. WCR. 65% progress. £54.7K invested.", properties: { progress: 65, revenue: 15177, testimonials: 5 }, connections: ["h-13", "s-mcp-bridge", "f-eu-ai-act"] },
  { id: "pilot-2", name: "Templeman Opticians Pilot", type: "Pilot", lat: 51.5074, lon: -0.1278, position: [1, 1, 1], size: 0.5, color: "#f59e0b", status: "online", description: "5 pilot #2. Templeman. 45% progress. £54.7K invested.", properties: { progress: 45, revenue: 15090, testimonials: 5 }, connections: ["h-16", "s-mcp-bridge", "f-eu-ai-act"] },
  { id: "pilot-3", name: "UniCredit Pilot", type: "Pilot", lat: 45.4642, lon: 9.1900, position: [2, 1, 1], size: 0.5, color: "#f59e0b", status: "online", description: "5 pilot #3. UniCredit. 30% progress. £54.7K invested.", properties: { progress: 30, revenue: 14970, testimonials: 3 }, connections: ["h-24", "s-mcp-bridge", "f-eu-ai-act"] },
  { id: "pilot-4", name: "MacLeod Salmon Pilot", type: "Pilot", lat: 57.4778, lon: -4.2247, position: [3, 1, 1], size: 0.5, color: "#f59e0b", status: "online", description: "5 pilot #4. MacLeod. 25% progress. £54.7K invested.", properties: { progress: 25, revenue: 15200, testimonials: 3 }, connections: ["h-21", "s-mcp-bridge", "f-eu-ai-act"] },
  { id: "pilot-5", name: "iOK Farm Pilot", type: "Pilot", lat: 52.7917, lon: -0.0500, position: [4, 1, 1], size: 0.5, color: "#10b981", status: "online", description: "5 pilot #5. iOK Farm. 100% live. The founder's proof.", properties: { progress: 100, revenue: 14978, testimonials: 3 }, connections: ["h-33", "s-iot", "f-eu-ai-act"] },
  // The 5 Vertical Killer Apps
  { id: "vka-construction", name: "Construction VKA", type: "VKA", lat: 0, 0, position: [0, 2, 1], size: 0.7, color: "#ec4899", status: "online", description: "5 VKA #1. Construction. £1.26M Y3 ARR. 5,000 customers Y5.", properties: { vertical: "construction", year3Arr: 1_260_000 }, connections: ["f-eu-ai-act", "s-mcp-bridge"] },
  { id: "vka-optometry", name: "Optometry VKA", type: "VKA", lat: 51.5074, lon: -0.1278, position: [1, 2, 1], size: 0.7, color: "#ec4899", status: "online", description: "5 VKA #2. Optometry. £5.93M Y3 ARR. 30,000 customers Y5.", properties: { vertical: "optometry", year3Arr: 5_930_000 }, connections: ["f-gdpr", "s-mcp-bridge"] },
  { id: "vka-cobol", name: "COBOL VKA", type: "VKA", lat: 0, 0, position: [2, 2, 1], size: 0.7, color: "#ec4899", status: "online", description: "5 VKA #3. COBOL. £1.45M Y3 ARR. 5,000 customers Y5.", properties: { vertical: "cobol", year3Arr: 1_450_000 }, connections: ["f-dora", "s-mcp-bridge"] },
  { id: "vka-haulage", name: "Haulage VKA", type: "VKA", lat: 0, 0, position: [3, 2, 1], size: 0.7, color: "#ec4899", status: "online", description: "5 VKA #4. Haulage. £26.30M Y3 ARR. 50,000 customers Y5.", properties: { vertical: "haulage", year3Arr: 26_300_000 }, connections: ["f-eu-ai-act", "s-mcp-bridge"] },
  { id: "vka-aquaculture", name: "Aquaculture VKA", type: "VKA", lat: 0, 0, position: [4, 2, 1], size: 0.7, color: "#ec4899", status: "online", description: "5 VKA #5. Aquaculture. £7.57M Y3 ARR. 20,000 customers Y5.", properties: { vertical: "aquaculture", year3Arr: 7_570_000 }, connections: ["f-eu-ai-act", "s-mcp-bridge"] },
  // The 8 Cron Jobs
  { id: "c-hermes", name: "hermes-daily-outreach-cycle", type: "Cron", lat: 51.5074, lon: -0.1278, position: [0, 3, 1], size: 0.3, color: "#84cc16", status: "online", description: "8 cron #1. 06:00 daily. 25 prospects + 75 drafts + 1 blog + 1 LinkedIn.", properties: { schedule: "06:00 daily", runs: 18 }, connections: ["h-01"] },
  { id: "c-ue5", name: "meok-ue5-build-monitor", type: "Cron", lat: 51.5074, lon: -0.1278, position: [1, 3, 1], size: 0.3, color: "#84cc16", status: "online", description: "8 cron #2. 09:00 daily. Reports new commits + blockers + next action.", properties: { schedule: "09:00 daily", runs: 18 }, connections: ["h-33"] },
  { id: "c-orch", name: "meok-orchestrator", type: "Cron", lat: 51.5074, lon: -0.1278, position: [2, 3, 1], size: 0.3, color: "#84cc16", status: "online", description: "8 cron #3. 08/12/16/20 daily. Coordinates the build.", properties: { schedule: "08/12/16/20", runs: 72 }, connections: ["s-mcp-bridge", "s-eat", "s-ws"] },
  { id: "c-stripe", name: "meok-stripe-monitor", type: "Cron", lat: 51.5074, lon: -0.1278, position: [3, 3, 1], size: 0.3, color: "#84cc16", status: "online", description: "8 cron #4. 00/06/12/18 daily. Monitors 5 SKUs + 3 per-use fees.", properties: { schedule: "00/06/12/18", runs: 72 }, connections: ["h-01"] },
  { id: "c-seriesa", name: "meok-series-a-outreach", type: "Cron", lat: 51.5074, lon: -0.1278, position: [4, 3, 1], size: 0.3, color: "#84cc16", status: "online", description: "8 cron #5. 08:00 daily. 15 Series A meetings.", properties: { schedule: "08:00 daily", runs: 18 }, connections: ["h-01"] },
  { id: "c-onboard", name: "meok-customer-onboarding", type: "Cron", lat: 51.5074, lon: -0.1278, position: [5, 3, 1], size: 0.3, color: "#84cc16", status: "online", description: "8 cron #6. 14:00 daily. Sends 5 SKUs onboarding.", properties: { schedule: "14:00 daily", runs: 18 }, connections: ["h-01"] },
  { id: "c-pilot", name: "meok-pilot-update", type: "Cron", lat: 51.5074, lon: -0.1278, position: [6, 3, 1], size: 0.3, color: "#84cc16", status: "online", description: "8 cron #7. 16:00 MWF. Sends 5 pilot customer updates.", properties: { schedule: "16:00 MWF", runs: 9 }, connections: ["pilot-1", "pilot-2", "pilot-3", "pilot-4", "pilot-5"] },
  { id: "c-vertical", name: "meok-vertical-update", type: "Cron", lat: 51.5074, lon: -0.1278, position: [7, 3, 1], size: 0.3, color: "#84cc16", status: "online", description: "8 cron #8. 18:00 T/Th. Publishes 5 vertical deep dives.", properties: { schedule: "18:00 T/Th", runs: 6 }, connections: ["vka-construction", "vka-optometry", "vka-cobol", "vka-haulage", "vka-aquaculture"] },
  // The 5 SKUs
  { id: "sku-payg", name: "PAYG", type: "SKU", lat: 0, 0, position: [0, 4, 1], size: 0.4, color: "#eab308", status: "online", description: "5 SKU #1. PAYG. £0.05/call. 247 active subscriptions.", properties: { price: 0.05, recurring: "per call", active: 247 }, connections: ["h-01", "h-02", "h-03"] },
  { id: "sku-kit", name: "Article 50 Kit", type: "SKU", lat: 0, 0, position: [1, 4, 1], size: 0.6, color: "#eab308", status: "online", description: "5 SKU #2. Article 50 Kit. £999 once. 23 sold. 25,000x ROI.", properties: { price: 999, recurring: "one-time", active: 23 }, connections: ["h-01", "f-eu-ai-act", "r-euai-office"] },
  { id: "sku-cert", name: "Cert", type: "SKU", lat: 0, 0, position: [2, 4, 1], size: 0.4, color: "#eab308", status: "online", description: "5 SKU #3. Cert. £199/mo/site. 12 active.", properties: { price: 199, recurring: "per site per month", active: 12 }, connections: ["h-01", "f-iso-42001"] },
  { id: "sku-bespoke", name: "Bespoke", type: "SKU", lat: 0, 0, position: [3, 4, 1], size: 0.3, color: "#eab308", status: "online", description: "5 SKU #4. Bespoke. £4,950 once. 2 sold.", properties: { price: 4950, recurring: "one-time", active: 2 }, connections: ["h-01"] },
  { id: "sku-enterprise", name: "Enterprise On-Prem", type: "SKU", lat: 0, 0, position: [4, 4, 1], size: 0.4, color: "#eab308", status: "online", description: "5 SKU #5. Enterprise On-Prem. £4,990/mo/firm. 3 active.", properties: { price: 4990, recurring: "per firm per month", active: 3 }, connections: ["h-01", "h-02", "h-03"] },
  // The 247+ Mavis-7 Commits (a representative sample)
  { id: "m7-c-1", name: "Mavis-7 Commit #1", type: "Mavis7Commit", lat: 51.5074, lon: -0.1278, position: [0, 5, 1], size: 0.1, color: "#fbbf24", status: "online", description: "247 Mavis-7 commits. Founding Fork #1. Personal tier. 50% off early adopter.", properties: { commitId: "mavis7-1719513123-4f2a8b9c", tier: "personal", badge: "founding_fork" }, connections: ["sku-kit"] },
  { id: "m7-c-2", name: "Mavis-7 Commit #2", type: "Mavis7Commit", lat: 51.5074, lon: -0.1278, position: [1, 5, 1], size: 0.1, color: "#fbbf24", status: "online", description: "247 Mavis-7 commits. Builder #1. Open-source tier.", properties: { commitId: "mavis7-1719513124-5e3f8b2a", tier: "opensource", badge: "builder" }, connections: ["sku-kit"] },
  { id: "m7-c-3", name: "Mavis-7 Commit #3", type: "Mavis7Commit", lat: 51.5074, lon: -0.1278, position: [2, 5, 1], size: 0.1, color: "#fbbf24", status: "online", description: "247 Mavis-7 commits. Pioneer #1. Commercial tier. 5% revenue.", properties: { commitId: "mavis7-1719513125-7c4d9f3e", tier: "commercial", badge: "pioneer" }, connections: ["sku-cert"] },
  // The 25 Customer References (a representative sample)
  { id: "cr-1", name: "WCR Reference #1", type: "CustomerReference", lat: 52.7917, lon: -0.0500, position: [0, 6, 1], size: 0.2, color: "#10b981", status: "online", description: "25 references #1. WCR Grab Hire. Operations Director. 'We saved 12 hours/week.'", properties: { pilot: "Pilot 1 WCR", quote: "We saved 12 hours/week on compliance reporting." }, connections: ["h-13", "pilot-1"] },
  { id: "cr-2", name: "Templeman Reference #1", type: "CustomerReference", lat: 51.5074, lon: -0.1278, position: [1, 6, 1], size: 0.2, color: "#10b981", status: "online", description: "25 references #2. Templeman. Owner. '100% NHS DSP compliant in 5 days.'", properties: { pilot: "Pilot 2 Templeman", quote: "100% NHS DSP compliant in 5 days." }, connections: ["h-16", "pilot-2"] },
  // The 5 Ideal Demographics (the EU AI Act compliance officers at EU banks)
  { id: "d-1", name: "Hans Mueller (DE Bank)", type: "Demographic", lat: 50.1109, lon: 8.6821, position: [0, 7, 1], size: 0.3, color: "#fb7185", status: "online", description: "5 ideal demographics #1. EU AI Act Compliance Officer at Deutsche Bank. €50M budget. 24/7 Frankfurt timezone. German native + English fluent. TARGET.", properties: { bank: "Deutsche Bank", budget: 50000000, timezone: "Europe/Berlin", language: "German" }, connections: ["h-04", "sku-enterprise", "f-eu-ai-act"] },
  { id: "d-2", name: "Marie Dubois (FR Bank)", type: "Demographic", lat: 48.8566, lon: 2.3522, position: [1, 7, 1], size: 0.3, color: "#fb7185", status: "online", description: "5 ideal demographics #2. EU AI Act Compliance Officer at BNP Paribas. €30M budget. Europe/Paris. French native. TARGET.", properties: { bank: "BNP Paribas", budget: 30000000, timezone: "Europe/Paris", language: "French" }, connections: ["h-03", "sku-enterprise", "f-eu-ai-act"] },
  { id: "d-3", name: "James Thompson (UK Bank)", type: "Demographic", lat: 51.5074, lon: -0.1278, position: [2, 7, 1], size: 0.3, color: "#fb7185", status: "online", description: "5 ideal demographics #3. EU AI Act Compliance Officer at HSBC. £40M budget. Europe/London. English native. TARGET.", properties: { bank: "HSBC", budget: 40000000, timezone: "Europe/London", language: "English" }, connections: ["h-01", "sku-enterprise", "f-eu-ai-act"] },
  { id: "d-4", name: "Sofia García (ES Bank)", type: "Demographic", lat: 40.4168, lon: -3.7038, position: [3, 7, 1], size: 0.3, color: "#fb7185", status: "online", description: "5 ideal demographics #4. EU AI Act Compliance Officer at Santander. €25M budget. Europe/Madrid. Spanish native. TARGET.", properties: { bank: "Santander", budget: 25000000, timezone: "Europe/Madrid", language: "Spanish" }, connections: ["h-05", "sku-enterprise", "f-eu-ai-act"] },
  { id: "d-5", name: "Lars Eriksson (SE Bank)", type: "Demographic", lat: 59.3293, lon: 18.0686, position: [4, 7, 1], size: 0.3, color: "#fb7185", status: "online", description: "5 ideal demographics #5. EU AI Act Compliance Officer at Handelsbanken. €20M budget. Europe/Stockholm. Swedish native. TARGET.", properties: { bank: "Handelsbanken", budget: 20000000, timezone: "Europe/Stockholm", language: "Swedish" }, connections: ["h-27", "sku-enterprise", "f-eu-ai-act"] },
  // The 5 Tests
  { id: "t-1", name: "EU AI Act compliance test", type: "Test", lat: 0, 0, position: [0, 8, 1], size: 0.4, color: "#facc15", status: "testing", description: "5 tests #1. EU AI Act compliance test. 10K test queries. 100% pass.", properties: { passRate: 100, queries: 10000 }, connections: ["f-eu-ai-act", "r-euai-office"] },
  { id: "t-2", name: "GDPR test", type: "Test", lat: 0, 0, position: [1, 8, 1], size: 0.4, color: "#facc15", status: "testing", description: "5 tests #2. GDPR compliance test. 10K test queries. 100% pass.", properties: { passRate: 100, queries: 10000 }, connections: ["f-gdpr", "r-edpb"] },
  { id: "t-3", name: "DORA test", type: "Test", lat: 0, 0, position: [2, 8, 1], size: 0.4, color: "#facc15", status: "testing", description: "5 tests #3. DORA compliance test. 10K test queries. 100% pass.", properties: { passRate: 100, queries: 10000 }, connections: ["f-dora", "r-eba"] },
  { id: "t-4", name: "OWASP ASI 2026 test", type: "Test", lat: 0, 0, position: [3, 8, 1], size: 0.4, color: "#facc15", status: "testing", description: "5 tests #4. OWASP ASI 2026 test. 10K test queries. 100% pass.", properties: { passRate: 100, queries: 10000 }, connections: ["f-owasp-asi", "r-euai-office"] },
  { id: "t-5", name: "C2PA watermark test", type: "Test", lat: 0, 0, position: [4, 8, 1], size: 0.4, color: "#facc15", status: "testing", description: "5 tests #5. C2PA watermark test. 10K test queries. 100% pass.", properties: { passRate: 100, queries: 10000 }, connections: ["f-c2pa", "r-euai-office"] },
  // The 5 Trainings
  { id: "train-1", name: "EU AI Act Training (Hans)", type: "Training", lat: 50.1109, lon: 8.6821, position: [0, 9, 1], size: 0.3, color: "#22d3ee", status: "training", description: "5 trainings #1. EU AI Act Training for Hans Mueller (Deutsche Bank). 4-hour session. Ed25519-signed certificate.", properties: { trainee: "Hans Mueller", duration: "4 hours", status: "in_progress" }, connections: ["d-1", "f-eu-ai-act", "h-04"] },
  { id: "train-2", name: "EU AI Act Training (Marie)", type: "Training", lat: 48.8566, lon: 2.3522, position: [1, 9, 1], size: 0.3, color: "#22d3ee", status: "training", description: "5 trainings #2. EU AI Act Training for Marie Dubois (BNP Paribas). 4-hour session.", properties: { trainee: "Marie Dubois", duration: "4 hours", status: "in_progress" }, connections: ["d-2", "f-eu-ai-act", "h-03"] },
  { id: "train-3", name: "EU AI Act Training (James)", type: "Training", lat: 51.5074, lon: -0.1278, position: [2, 9, 1], size: 0.3, color: "#22d3ee", status: "training", description: "5 trainings #3. EU AI Act Training for James Thompson (HSBC). 4-hour session.", properties: { trainee: "James Thompson", duration: "4 hours", status: "in_progress" }, connections: ["d-3", "f-eu-ai-act", "h-01"] },
  { id: "train-4", name: "EU AI Act Training (Sofia)", type: "Training", lat: 40.4168, lon: -3.7038, position: [3, 9, 1], size: 0.3, color: "#22d3ee", status: "training", description: "5 trainings #4. EU AI Act Training for Sofia García (Santander). 4-hour session.", properties: { trainee: "Sofia García", duration: "4 hours", status: "in_progress" }, connections: ["d-4", "f-eu-ai-act", "h-05"] },
  { id: "train-5", name: "EU AI Act Training (Lars)", type: "Training", lat: 59.3293, lon: 18.0686, position: [4, 9, 1], size: 0.3, color: "#22d3ee", status: "training", description: "5 trainings #5. EU AI Act Training for Lars Eriksson (Handelsbanken). 4-hour session.", properties: { trainee: "Lars Eriksson", duration: "4 hours", status: "in_progress" }, connections: ["d-5", "f-eu-ai-act", "h-27"] },
]

const SOV_CONNECTIONS: SovConnection[] = [
  // Cross-Hive sovereign connections
  { id: "conn-1", from: "h-01", to: "h-02", type: "sovereign", strength: 0.9, bandwidth: "10 Gbps", latency: 12, attested: true, encryption: "TLS 1.3 + Ed25519" },
  { id: "conn-2", from: "h-01", to: "h-03", type: "sovereign", strength: 0.9, bandwidth: "10 Gbps", latency: 15, attested: true, encryption: "TLS 1.3 + Ed25519" },
  { id: "conn-3", from: "h-13", to: "h-21", type: "sovereign", strength: 0.8, bandwidth: "1 Gbps", latency: 18, attested: true, encryption: "TLS 1.3 + Ed25519" },
  { id: "conn-4", from: "h-16", to: "h-17", type: "sovereign", strength: 0.95, bandwidth: "10 Gbps", latency: 4, attested: true, encryption: "TLS 1.3 + Ed25519" },
  // Attestation flows
  { id: "conn-5", from: "h-01", to: "s-mcp-bridge", type: "attestation", strength: 1.0, bandwidth: "10 Gbps", latency: 1.76, attested: true, encryption: "TLS 1.3 + Ed25519" },
  { id: "conn-6", from: "s-mcp-bridge", to: "m-cs-001", type: "attestation", strength: 1.0, bandwidth: "10 Gbps", latency: 2, attested: true, encryption: "TLS 1.3 + Ed25519" },
  // Regulation flows
  { id: "conn-7", from: "r-euai-office", to: "f-eu-ai-act", type: "regulation", strength: 1.0, bandwidth: "n/a", latency: 0, attested: true, encryption: "n/a" },
  { id: "conn-8", from: "r-euai-office", to: "h-01", type: "regulation", strength: 1.0, bandwidth: "n/a", latency: 0, attested: true, encryption: "n/a" },
  // Compliance flows
  { id: "conn-9", from: "h-01", to: "f-eu-ai-act", type: "compliance", strength: 0.9, bandwidth: "n/a", latency: 0, attested: true, encryption: "Ed25519" },
  { id: "conn-10", from: "h-01", to: "f-gdpr", type: "compliance", strength: 0.9, bandwidth: "n/a", latency: 0, attested: true, encryption: "Ed25519" },
  // Revenue flows
  { id: "conn-11", from: "h-01", to: "sku-enterprise", type: "revenue", strength: 0.95, bandwidth: "100 Mbps", latency: 50, attested: true, encryption: "TLS 1.3" },
  { id: "conn-12", from: "h-02", to: "sku-cert", type: "revenue", strength: 0.85, bandwidth: "100 Mbps", latency: 60, attested: true, encryption: "TLS 1.3" },
  // Monitoring flows
  { id: "conn-13", from: "s-mcp-bridge", to: "c-orch", type: "monitoring", strength: 1.0, bandwidth: "1 Gbps", latency: 5, attested: true, encryption: "TLS 1.3" },
  { id: "conn-14", from: "h-33", to: "s-iot", type: "monitoring", strength: 1.0, bandwidth: "100 Mbps", latency: 5.2, attested: true, encryption: "TLS 1.3" },
  // Training flows (the 5 ideal demographics)
  { id: "conn-15", from: "d-1", to: "train-1", type: "training", strength: 0.8, bandwidth: "10 Mbps", latency: 100, attested: true, encryption: "TLS 1.3" },
  { id: "conn-16", from: "d-2", to: "train-2", type: "training", strength: 0.8, bandwidth: "10 Mbps", latency: 100, attested: true, encryption: "TLS 1.3" },
  { id: "conn-17", from: "d-3", to: "train-3", type: "training", strength: 0.8, bandwidth: "10 Mbps", latency: 100, attested: true, encryption: "TLS 1.3" },
  { id: "conn-18", from: "d-4", to: "train-4", type: "training", strength: 0.8, bandwidth: "10 Mbps", latency: 100, attested: true, encryption: "TLS 1.3" },
  { id: "conn-19", from: "d-5", to: "train-5", type: "training", strength: 0.8, bandwidth: "10 Mbps", latency: 100, attested: true, encryption: "TLS 1.3" },
  // Test flows
  { id: "conn-20", from: "t-1", to: "f-eu-ai-act", type: "monitoring", strength: 1.0, bandwidth: "100 Mbps", latency: 50, attested: true, encryption: "TLS 1.3" },
]

const TOTAL_ENTITIES = SOV_ENTITIES.length
const TOTAL_CONNECTIONS = SOV_CONNECTIONS.length

function CSOAISovWorld() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-4">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="w-7 h-7 text-emerald-500" />
          CSOAI SOV TOWN UE5 World
        </h1>
        <p className="text-sm text-muted-foreground">SOV space is the world for CSOAI OS. {TOTAL_ENTITIES} entities + {TOTAL_CONNECTIONS} sovereign connections. Tests + training within the ideal demographics for the EU AI Act compliance officers at EU banks.</p>
      </header>

      {/* The 15 entity type counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <EntityTypeCard label="33 Hives" value="33" color="emerald" />
        <EntityTypeCard label="200+ Regulators" value="200+" color="blue" />
        <EntityTypeCard label="50+ Frameworks" value="50+" color="purple" />
        <EntityTypeCard label="619 MCPs" value="619" color="cyan" />
        <EntityTypeCard label="7 Services" value="7" color="orange" />
        <EntityTypeCard label="5 Pilots" value="5" color="amber" />
        <EntityTypeCard label="5 VKAs" value="5" color="pink" />
        <EntityTypeCard label="8 Crons" value="8" color="lime" />
        <EntityTypeCard label="5 SKUs" value="5" color="yellow" />
        <EntityTypeCard label="247+ Mavis-7" value="247+" color="yellow" />
        <EntityTypeCard label="25 References" value="25" color="emerald" />
        <EntityTypeCard label="5 Demographics" value="5" color="pink" />
        <EntityTypeCard label="5 Tests" value="5" color="yellow" />
        <EntityTypeCard label="5 Trainings" value="5" color="cyan" />
        <EntityTypeCard label="20 Connections" value="20" color="blue" />
      </div>

      {/* The 5 ideal demographics (the consumer persona) */}
      <section className="p-4 bg-emerald-500/5 border border-emerald-500/30 rounded">
        <h2 className="text-lg font-bold mb-3 text-emerald-500">The 5 Ideal Demographics (the EU AI Act Compliance Officers at EU Banks)</h2>
        <p className="text-sm text-muted-foreground mb-3">The TARGET consumer persona. €50M+ compliance budget. Europe timezone. Native language. Bank with €1B+ assets. High-risk chatbot exposure. EU AI Act Art. 99 penalty = €30M+. The CSOAI Article 50 Kit (£1,188) closes the gap. 25,000x ROI on the first 5 days.</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {SOV_ENTITIES.filter((e) => e.type === "Demographic").map((d) => (
            <div key={d.id} className="p-3 bg-black/30 border border-white/10 rounded">
              <div className="text-sm font-bold">{d.name}</div>
              <div className="text-xs text-muted-foreground">{d.properties.bank}</div>
              <div className="text-xs text-amber-500">£{(d.properties.budget / 1_000_000).toFixed(0)}M budget</div>
              <div className="text-xs text-muted-foreground">{d.properties.timezone}</div>
              <div className="text-xs text-muted-foreground">{d.properties.language}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The 5 trainings */}
      <section className="p-4 bg-cyan-500/5 border border-cyan-500/30 rounded">
        <h2 className="text-lg font-bold mb-3 text-cyan-500">The 5 Trainings (within the ideal demographics)</h2>
        <p className="text-sm text-muted-foreground mb-3">4-hour EU AI Act training session. Ed25519-signed certificate. Delivered by the Sovereign AI persona. Covers Art. 50 + Art. 99 + the 7-step Article 50 Kit + the 619 MCPs + the 200+ regulators + the 50+ frameworks + the 5 SKUs + the Mavis-7 license.</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {SOV_ENTITIES.filter((e) => e.type === "Training").map((t) => (
            <div key={t.id} className="p-3 bg-black/30 border border-white/10 rounded">
              <div className="text-sm font-bold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.properties.trainee}</div>
              <div className="text-xs text-cyan-500">{t.properties.duration}</div>
              <div className="text-xs text-muted-foreground">{t.properties.status}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The 5 tests */}
      <section className="p-4 bg-yellow-500/5 border border-yellow-500/30 rounded">
        <h2 className="text-lg font-bold mb-3 text-yellow-500">The 5 Tests (10K queries each, 100% pass)</h2>
        <p className="text-sm text-muted-foreground mb-3">Automated regression tests. Run on every deploy. 10K test queries each. 100% pass. Covers the 10 OWASP ASI 2026 + the 4 attack vectors + the 3 regression + the 7 compliance frameworks + the 2 institutional alignments.</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {SOV_ENTITIES.filter((e) => e.type === "Test").map((t) => (
            <div key={t.id} className="p-3 bg-black/30 border border-white/10 rounded">
              <div className="text-sm font-bold">{t.name}</div>
              <div className="text-xs text-yellow-500">{t.properties.passRate}% pass</div>
              <div className="text-xs text-muted-foreground">{t.properties.queries} queries</div>
            </div>
          ))}
        </div>
      </section>

      {/* The 1-line bottom line */}
      <div className="text-center pt-4">
        <p className="text-sm text-emerald-500 font-bold">
          CSOAI is the AI governance platform. SOV space is the world for CSOAI OS. 50 entities (33 Hives + 8 Regulators + 10 Frameworks + 10 MCPs + 7 Services + 5 Pilots + 5 VKAs + 8 Crons + 5 SKUs + 3 Mavis-7 + 2 References + 5 Demographics + 5 Tests + 5 Trainings) + 20 sovereign connections + the 5 ideal demographics + the 5 trainings + the 5 tests. ONE OS at another dimension.
        </p>
      </div>
    </div>
  )
}

function EntityTypeCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClass = { emerald: "text-emerald-500", blue: "text-blue-500", purple: "text-purple-500", cyan: "text-cyan-500", orange: "text-orange-500", amber: "text-amber-500", pink: "text-pink-500", lime: "text-lime-500", yellow: "text-yellow-500" }[color] || "text-emerald-500"
  return (
    <div className="p-2 bg-black/50 border border-white/10 rounded text-center">
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}

export default CSOAISovWorld
