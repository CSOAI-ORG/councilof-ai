/**
 * Seed Council Sessions
 * Generates sample 33-agent council voting sessions for marketing page
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { councilSessions, agentVotes } from './drizzle/schema.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

// Sample scenarios for council voting
const scenarios = [
  {
    subjectType: 'watchdog_report',
    subjectTitle: 'Unauthorized Data Collection by Healthcare AI',
    subjectDescription: 'Watchdog report alleges a medical diagnosis AI is collecting patient data beyond stated consent scope, violating GDPR Article 5.',
    outcome: 'approved', // Consensus to approve the report
    approveRatio: 0.75, // 75% approve
  },
  {
    subjectType: 'watchdog_report',
    subjectTitle: 'Biased Hiring Algorithm Discrimination',
    subjectDescription: 'AI recruitment tool shows systematic bias against candidates from certain demographic groups, violating EU AI Act Article 10.',
    outcome: 'approved',
    approveRatio: 0.85,
  },
  {
    subjectType: 'watchdog_report',
    subjectTitle: 'Autonomous Vehicle Safety Protocol Breach',
    subjectDescription: 'Self-driving car AI failed to engage emergency protocols during critical incident, raising TC260 safety compliance concerns.',
    outcome: 'escalated', // No clear consensus
    approveRatio: 0.50,
  },
  {
    subjectType: 'assessment',
    subjectTitle: 'Financial Trading AI Risk Assessment',
    subjectDescription: 'High-frequency trading algorithm requires council review for systemic risk evaluation under NIST AI RMF guidelines.',
    outcome: 'rejected', // Consensus to reject
    approveRatio: 0.20,
  },
  {
    subjectType: 'watchdog_report',
    subjectTitle: 'Facial Recognition Privacy Violation',
    subjectDescription: 'Public surveillance AI deployed without proper consent mechanisms, violating multiple privacy frameworks.',
    outcome: 'approved',
    approveRatio: 0.90,
  },
];

const agentTypes = ['guardian', 'arbiter', 'scribe'];
const providers = ['openai', 'anthropic', 'google', 'kimi', 'deepseek'];

// Reasoning templates for different vote types
const reasoningTemplates = {
  approve: [
    'Evidence clearly demonstrates non-compliance with stated framework requirements.',
    'Incident severity warrants immediate council attention and public disclosure.',
    'Documentation provided meets threshold for legitimate safety concern.',
    'Pattern of violations indicates systemic governance failure.',
    'Risk assessment confirms high probability of harm without intervention.',
  ],
  reject: [
    'Insufficient evidence to substantiate claims of framework violation.',
    'Incident appears to be isolated case without systemic implications.',
    'Existing safeguards adequately address the identified concerns.',
    'Documentation lacks required technical specificity for council action.',
    'Risk level does not meet threshold for escalation.',
  ],
  escalate: [
    'Case requires additional expert review before final determination.',
    'Evidence is contradictory and warrants further investigation.',
    'Complexity of technical issues exceeds standard council evaluation scope.',
    'Potential precedent-setting implications require human oversight.',
    'Insufficient information to make confident determination.',
  ],
};

function getRandomReasoning(voteType) {
  const templates = reasoningTemplates[voteType];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateVotes(scenario) {
  const votes = [];
  const { approveRatio } = scenario;
  
  // Generate 33 votes
  for (let i = 1; i <= 33; i++) {
    const agentType = agentTypes[Math.floor((i - 1) / 11)]; // 11 of each type
    const provider = providers[(i - 1) % 5]; // Rotate through providers
    
    // Determine vote based on scenario outcome
    let vote;
    let confidence;
    
    const rand = Math.random();
    if (scenario.outcome === 'approved') {
      if (rand < approveRatio) {
        vote = 'approve';
        confidence = (0.75 + Math.random() * 0.25).toFixed(2); // 0.75-1.0
      } else if (rand < approveRatio + 0.15) {
        vote = 'reject';
        confidence = (0.60 + Math.random() * 0.20).toFixed(2); // 0.60-0.80
      } else {
        vote = 'escalate';
        confidence = (0.50 + Math.random() * 0.20).toFixed(2); // 0.50-0.70
      }
    } else if (scenario.outcome === 'rejected') {
      if (rand < (1 - approveRatio)) {
        vote = 'reject';
        confidence = (0.75 + Math.random() * 0.25).toFixed(2);
      } else if (rand < (1 - approveRatio + 0.15)) {
        vote = 'approve';
        confidence = (0.60 + Math.random() * 0.20).toFixed(2);
      } else {
        vote = 'escalate';
        confidence = (0.50 + Math.random() * 0.20).toFixed(2);
      }
    } else { // escalated
      if (rand < 0.33) {
        vote = 'approve';
        confidence = (0.55 + Math.random() * 0.20).toFixed(2);
      } else if (rand < 0.66) {
        vote = 'reject';
        confidence = (0.55 + Math.random() * 0.20).toFixed(2);
      } else {
        vote = 'escalate';
        confidence = (0.60 + Math.random() * 0.25).toFixed(2);
      }
    }
    
    votes.push({
      agentId: `agent_${i}`,
      agentType,
      agentProvider: provider,
      vote,
      confidence,
      reasoning: getRandomReasoning(vote),
    });
  }
  
  return votes;
}

async function seedCouncilSessions() {
  console.log('🌱 Seeding council sessions...\n');
  
  try {
    for (const scenario of scenarios) {
      console.log(`Creating session: ${scenario.subjectTitle}`);
      
      // Generate votes
      const votes = generateVotes(scenario);
      
      // Count votes
      const voteCounts = votes.reduce(
        (acc, v) => {
          acc[v.vote]++;
          return acc;
        },
        { approve: 0, reject: 0, escalate: 0 }
      );
      
      // Determine consensus
      let consensusStatus;
      let finalDecision;
      if (voteCounts.approve >= 22) {
        consensusStatus = 'approved';
        finalDecision = 'approved';
      } else if (voteCounts.reject >= 22) {
        consensusStatus = 'rejected';
        finalDecision = 'rejected';
      } else {
        consensusStatus = 'escalated';
        finalDecision = 'escalated';
      }
      
      // Insert session
      const [session] = await db
        .insert(councilSessions)
        .values({
          subjectType: scenario.subjectType,
          subjectId: 1, // Placeholder ID
          subjectTitle: scenario.subjectTitle,
          subjectDescription: scenario.subjectDescription,
          status: consensusStatus === 'approved' || consensusStatus === 'rejected' ? 'consensus_reached' : 'escalated_to_human',
          totalVotes: 33,
          approveVotes: voteCounts.approve,
          rejectVotes: voteCounts.reject,
          escalateVotes: voteCounts.escalate,
          finalDecision,
          humanReviewerId: null,
          humanDecision: null,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        })
        .returning();
      
      // Insert votes
      const voteRecords = votes.map((v) => ({
        sessionId: session.id,
        ...v,
      }));
      
      await db.insert(agentVotes).values(voteRecords);
      
      console.log(`  ✓ Session ${session.id}: ${voteCounts.approve}A / ${voteCounts.reject}R / ${voteCounts.escalate}E → ${consensusStatus.toUpperCase()}`);
    }
    
    console.log('\n✅ Successfully seeded 5 council sessions with 165 total votes!');
    console.log('🎯 Marketing page will now display live council data.\n');
    
  } catch (error) {
    console.error('❌ Error seeding council sessions:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedCouncilSessions();
