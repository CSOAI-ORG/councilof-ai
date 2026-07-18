/**
 * Unified AI Provider Types
 * Supports 12 providers (24 models) for Multi-AI Council V2.0
 */

export type AIProvider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'meta'
  | 'mistral'
  | 'cohere'
  | 'xai'
  | 'alibaba'
  | 'baidu'
  | 'deepseek'
  | '01ai'
  | 'perplexity';

export type AIModel = 
  // OpenAI
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'o1'
  // Anthropic
  | 'claude-3-5-sonnet'
  | 'claude-3-opus'
  | 'claude-3-haiku'
  // Google
  | 'gemini-2-0-flash'
  | 'gemini-1-5-pro'
  | 'gemini-1-0-ultra'
  // Meta
  | 'llama-3-3-70b'
  | 'llama-3-1-405b'
  // Mistral
  | 'mistral-large-2'
  | 'mixtral-8x22b'
  // Cohere
  | 'command-r-plus'
  | 'command-r'
  // xAI
  | 'grok-2'
  // Alibaba
  | 'qwen-2-5-72b'
  // Baidu
  | 'ernie-4-0'
  // DeepSeek
  | 'deepseek-v2'
  // 01.AI
  | 'yi-large'
  // Perplexity
  | 'pplx-70b-online';

export interface AIProviderConfig {
  provider: AIProvider;
  model: AIModel;
  apiKey: string;
  baseURL?: string;
  weight: number; // Voting weight (1.0 = standard, 1.5 = flagship, 2.0 = reasoning)
  category: 'flagship' | 'reasoning' | 'speed' | 'open-source' | 'realtime';
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  context?: Record<string, any>;
}

export interface AIResponse {
  provider: AIProvider;
  model: AIModel;
  content: string;
  reasoning?: string;
  confidence?: number; // 0-100
  tokensUsed?: number;
  latencyMs?: number;
  error?: string;
}

export interface VotingResult {
  vote: 'approve' | 'reject' | 'escalate';
  confidence: number;
  reasoning: string;
}

export interface CouncilQuestion {
  id: number;
  category: 'risk_assessment' | 'compliance_mapping' | 'remediation';
  question: string;
  context: Record<string, any>;
}

export interface CouncilDecision {
  questionId: number;
  responses: AIResponse[];
  consensus: 'strong' | 'moderate' | 'weak' | 'none';
  consensusPercentage: number;
  majorityVote: 'approve' | 'reject' | 'escalate';
  outliers: AIResponse[]; // Models that strongly disagreed
  escalationReason?: string;
}

export interface MultiAICouncilResult {
  sessionId: string;
  aiSystemId: number;
  questions: CouncilQuestion[];
  decisions: CouncilDecision[];
  overallConsensus: 'strong' | 'moderate' | 'weak' | 'none';
  humanReviewRequired: boolean;
  escalationTier: 'auto' | 'analyst' | 'expert_panel';
  rewardModelScore?: number; // RLHF quality score (0-100)
  timestamp: Date;
}
