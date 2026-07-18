/**
 * Anthropic Claude Provider
 * Integrates Claude 3.5 Sonnet, Opus, and Haiku models
 */

import { BaseAIProvider } from './BaseProvider';
import type { AIProviderConfig, AIResponse, AIMessage } from './types';

export class AnthropicProvider extends BaseAIProvider {
  private anthropicBaseURL = 'https://api.anthropic.com/v1';

  constructor(provider: AIProvider, model: AIModel, apiKey: string, weight: number) {
    super(provider, model, apiKey, weight, 'https://api.anthropic.com/v1');
    
    if (!this.apiKey) {
      console.warn('[AnthropicProvider] ANTHROPIC_API_KEY not found in environment');
    }
  }

  async chat(messages: AIMessage[], options?: any): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      // Convert messages to Anthropic format
      const anthropicMessages = messages.map((msg) => ({
        role: msg.role === 'system' ? 'user' : msg.role, // Anthropic doesn't have system role
        content: msg.content,
      }));

      // Extract system message if present
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';

      const response = await fetch(`${this.anthropicBaseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.getActualModelName(),
          max_tokens: options?.maxTokens || 4096,
          temperature: options?.temperature || 0.7,
          system: systemMessage,
          messages: anthropicMessages.filter((m) => m.role !== 'system'),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        provider: this.config.provider,
        model: this.config.model,
        content: data.content[0].text,
        tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
        confidence: 85, // Default confidence for Anthropic
      };
    } catch (error) {
      console.error('[AnthropicProvider] Chat error:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await this.chat([
        { role: 'user', content: 'Test' },
      ], { maxTokens: 10 });
      return !!response.content;
    } catch (error) {
      console.error('[AnthropicProvider] Health check failed:', error);
      return false;
    }
  }
}

// Export pre-configured instances
export const claudeSonnet = new AnthropicProvider({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet',
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  weight: 1.5,
  category: 'flagship',
});

export const claudeOpus = new AnthropicProvider({
  provider: 'anthropic',
  model: 'claude-3-opus',
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  weight: 1.5,
  category: 'flagship',
});

export const claudeHaiku = new AnthropicProvider({
  provider: 'anthropic',
  model: 'claude-3-haiku',
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  weight: 1.0,
  category: 'speed',
});
