/**
 * Seed script for sample Watchdog reports and case assignments
 * Run with: pnpm tsx scripts/seed-cases.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
  watchdogReports,
  councilSessions,
  agentVotes,
  caseAssignments,
  users,
} from "../drizzle/schema";

// Sample Watchdog reports
const sampleReports = [
  {
    title: "Gender bias detected in job recommendation AI",
    description: "A user reported that a job recommendation system consistently shows higher-paying tech jobs to male users while showing administrative roles to female users with similar qualifications. Testing with controlled profiles showed a 40% wage gap in recommended positions based solely on gender indicators.",
    aiSystemName: "TechRecruit AI v3.2",
    companyName: "TechRecruit Inc",
    incidentType: "bias" as const,
    severity: "high" as const,
    status: "under_review" as const,
  },
  {
    title: "AI chatbot providing medical advice without disclaimer",
    description: "A health-focused chatbot is providing specific medical diagnoses and treatment recommendations without proper disclaimers or suggestions to consult healthcare professionals. Multiple users have reported following AI advice instead of seeking professional medical help, with at least one case resulting in delayed treatment.",
    aiSystemName: "HealthBot Pro",
    companyName: "HealthBot Inc",
    incidentType: "safety" as const,
    severity: "critical" as const,
    status: "under_review" as const,
  },
  {
    title: "Privacy concern: AI assistant storing conversation history",
    description: "Users discovered that an AI assistant is storing full conversation histories including sensitive personal information without clear consent or data retention policies. The data appears to be used for model training without explicit user opt-in.",
    aiSystemName: "AssistAI Personal",
    companyName: "AssistAI Corp",
    incidentType: "privacy" as const,
    severity: "medium" as const,
    status: "under_review" as const,
  },
  {
    title: "AI content moderation flagging legitimate news as misinformation",
    description: "An AI-powered content moderation system is incorrectly flagging legitimate news articles from established outlets as misinformation. The system appears to have a bias against certain political viewpoints, affecting press freedom.",
    aiSystemName: "TruthGuard AI",
    companyName: "SocialMedia Corp",
    incidentType: "misinformation" as const,
    severity: "high" as const,
    status: "under_review" as const,
  },
  {
    title: "Facial recognition system showing racial bias in accuracy",
    description: "A facial recognition system deployed at airport security shows significantly lower accuracy rates for individuals with darker skin tones. Error rates are 34% higher for Black individuals compared to white individuals, leading to disproportionate secondary screening.",
    aiSystemName: "SecureFace Pro",
    companyName: "SecurityTech Ltd",
    incidentType: "bias" as const,
    severity: "critical" as const,
    status: "under_review" as const,
  },
  {
    title: "AI loan approval system discriminating based on zip code",
    description: "An AI-powered loan approval system appears to be using zip code as a proxy for race, resulting in higher rejection rates for applicants from predominantly minority neighborhoods despite similar credit profiles.",
    aiSystemName: "LoanDecision AI",
    companyName: "QuickLoan Finance",
    incidentType: "bias" as const,
    severity: "high" as const,
    status: "submitted" as const,
  },
  {
    title: "Deepfake detection AI failing on political content",
    description: "A deepfake detection system is showing inconsistent performance on political content, failing to flag obvious manipulated videos of certain political figures while flagging authentic content from others.",
    aiSystemName: "DeepDetect v2",
    companyName: "MediaVerify Inc",
    incidentType: "manipulation" as const,
    severity: "medium" as const,
    status: "submitted" as const,
  },
];

// Generate 33 agent votes for a council session
function generateAgentVotes(sessionId: number) {
  const votes: Array<{
    sessionId: number;
    agentId: string;
    agentType: "guardian" | "arbiter" | "scribe";
    agentProvider: "openai" | "anthropic" | "google";
    vote: "approve" | "reject" | "escalate";
    confidence: string;
    reasoning: string;
  }> = [];
  
  const types: Array<"guardian" | "arbiter" | "scribe"> = ["guardian", "arbiter", "scribe"];
  const providers: Array<"openai" | "anthropic" | "google"> = ["openai", "anthropic", "google"];
  
  let agentNum = 1;
  for (const type of types) {
    for (let i = 0; i < 11; i++) {
      const provider = providers[i % 3];
      // Generate somewhat random but realistic voting pattern
      const voteWeights = [0.3, 0.4, 0.3]; // Slight bias toward reject for escalation
      const rand = Math.random();
      let vote: "approve" | "reject" | "escalate";
      if (rand < voteWeights[0]) vote = "approve";
      else if (rand < voteWeights[0] + voteWeights[1]) vote = "reject";
      else vote = "escalate";
      
      votes.push({
        sessionId,
        agentId: `agent_${agentNum}`,
        agentType: type,
        agentProvider: provider,
        vote,
        confidence: (0.6 + Math.random() * 0.35).toFixed(2),
        reasoning: `Analysis based on ${type} perspective indicates ${vote} recommendation.`,
      });
      agentNum++;
    }
  }
  return votes;
}

async function seedCases() {
  console.log("🌱 Starting case seeding...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable not set");
    process.exit(1);
  }

  const db = drizzle(databaseUrl);

  try {
    // Get all users who are watchdog analysts
    const analysts = await db
      .select()
      .from(users)
      .where(eq(users.role, "watchdog_analyst"));

    // Also get admins as potential analysts
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    const allAnalysts = [...analysts, ...admins];
    
    if (allAnalysts.length === 0) {
      console.log("⚠️ No analysts found. Creating sample reports without assignments.");
    } else {
      console.log(`📋 Found ${allAnalysts.length} potential analysts`);
    }

    // Insert sample reports
    console.log("📝 Creating watchdog reports...");
    const reportIds: number[] = [];
    
    for (const report of sampleReports) {
      const [result] = await db.insert(watchdogReports).values(report).$returningId();
      reportIds.push(result.id);
      console.log(`  ✓ Created report: ${report.title.substring(0, 50)}...`);
    }

    // Create council sessions for reports under review
    console.log("\n🏛️ Creating council sessions...");
    const sessionIds: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const report = sampleReports[i];
      const [session] = await db.insert(councilSessions).values({
        subjectType: "watchdog_report",
        subjectId: reportIds[i],
        subjectTitle: report.title,
        subjectDescription: report.description,
        status: "escalated_to_human",
        totalVotes: 33,
        approveVotes: Math.floor(8 + Math.random() * 5),
        rejectVotes: Math.floor(10 + Math.random() * 8),
        escalateVotes: Math.floor(8 + Math.random() * 5),
      }).$returningId();
      
      sessionIds.push(session.id);
      console.log(`  ✓ Created council session for report ${reportIds[i]}`);

      // Generate and insert agent votes
      const votes = generateAgentVotes(session.id);
      for (const vote of votes) {
        await db.insert(agentVotes).values(vote);
      }
      console.log(`    → Added 33 agent votes`);
    }

    // Create case assignments for analysts
    if (allAnalysts.length > 0) {
      console.log("\n📋 Creating case assignments...");
      
      for (let i = 0; i < Math.min(5, reportIds.length); i++) {
        const analyst = allAnalysts[i % allAnalysts.length];
        const priorities: Array<"low" | "medium" | "high" | "urgent"> = ["low", "medium", "high", "urgent"];
        const priority = priorities[Math.min(i, 3)];
        
        // Due date is 2-5 days from now
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + 2 + Math.floor(Math.random() * 3));

        await db.insert(caseAssignments).values({
          analystId: analyst.id,
          reportId: reportIds[i],
          councilSessionId: sessionIds[i] || null,
          priority,
          status: "assigned",
          dueAt,
        });
        
        console.log(`  ✓ Assigned case ${reportIds[i]} to analyst ${analyst.name || analyst.email || analyst.id}`);
      }
    }

    console.log("\n✅ Case seeding complete!");
    console.log(`   - ${sampleReports.length} watchdog reports created`);
    console.log(`   - ${sessionIds.length} council sessions created`);
    console.log(`   - ${Math.min(5, reportIds.length)} case assignments created`);

  } catch (error) {
    console.error("❌ Error seeding cases:", error);
    throw error;
  }
}

seedCases().catch(console.error);
