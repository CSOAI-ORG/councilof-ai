// Simple script to seed agent votes for existing council sessions
import { getDb } from './server/db';
import { agentVotes } from './drizzle/schema';

async function seedVotes() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  console.log('🌱 Seeding agent votes for session 1...');

  const votes = [];
  for (let i = 1; i <= 33; i++) {
    const agentType = i <= 11 ? 'guardian' : i <= 22 ? 'arbiter' : 'scribe';
    const providers = ['openai', 'anthropic', 'google', 'kimi', 'deepseek'];
    const provider = providers[(i - 1) % 5];
    
    // 25 approve, 5 reject, 3 escalate
    let vote: 'approve' | 'reject' | 'escalate';
    if (i <= 25) vote = 'approve';
    else if (i <= 30) vote = 'reject';
    else vote = 'escalate';
    
    const confidence = (0.75 + Math.random() * 0.25).toFixed(2);
    
    votes.push({
      sessionId: 1,
      agentId: `agent_${i}`,
      agentType,
      agentProvider: provider,
      vote,
      confidence,
      reasoning: 'Evidence clearly demonstrates non-compliance with stated framework requirements.',
    });
  }

  await db.insert(agentVotes).values(votes);
  console.log('✅ Successfully seeded 33 votes for session 1!');
  process.exit(0);
}

seedVotes();
