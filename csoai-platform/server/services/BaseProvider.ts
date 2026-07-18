/**
 * Base AI Provider Class
 * Abstract class that all providers must implement
 */

import type { AIRequest, AIResponse, AIProvider, AIModel, VotingResult } from './types';

export abstract class BaseAIProvider {
  protected provider: AIProvider;
  protected model: AIModel;
  protected apiKey: string;
  protected baseURL?: string;
  protected weight: number;

  constructor(provider: AIProvider, model: AIModel, apiKey: string, weight: number, baseURL?: string) {
    this.provider = provider;
    this.model = model;
    this.apiKey = apiKey;
    this.weight = weight;
    this.baseURL = baseURL;
  }

  /**
   * Send a request to the AI provider
   */
  abstract sendRequest(request: AIRequest): Promise<AIResponse>;

  /**
   * Parse voting response from AI
   */
  protected parseVotingResponse(content: string): VotingResult {
    try {
      // Try to parse as JSON first
      const json = JSON.parse(content);
      return {
        vote: json.vote || 'escalate',
        confidence: json.confidence || 50,
        reasoning: json.reasoning || content,
      };
    } catch {
      // Fallback: parse from natural language
      const lowerContent = content.toLowerCase();
      
      let vote: 'approve' | 'reject' | 'escalate' = 'escalate';
      if (lowerContent.includes('approve') || lowerContent.includes('compliant')) {
        vote = 'approve';
      } else if (lowerContent.includes('reject') || lowerContent.includes('non-compliant')) {
        vote = 'reject';
      }

      // Extract confidence (look for percentages)
      const confidenceMatch = content.match(/(\d+)%/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70;

      return {
        vote,
        confidence,
        reasoning: content,
      };
    }
  }

  /**
   * Handle API errors gracefully
   */
  protected handleError(error: any): AIResponse {
    return {
      provider: this.provider,
      model: this.model,
      content: '',
      error: error.message || 'Unknown error',
      confidence: 0,
    };
  }

  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      provider: this.provider,
      model: this.model,
      weight: this.weight,
    };
  }
}
