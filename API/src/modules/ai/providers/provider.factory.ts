import { AIProvider } from './ai.provider.interface';
import { MockAIProvider } from './mock.provider';
import { GeminiAIProvider } from './gemini.provider';

export function createAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER?.toLowerCase() || 'mock';

  switch (providerType) {
    case 'gemini':
      return new GeminiAIProvider();
    case 'claude':
      if (!process.env.AI_API_KEY) {
        throw new Error('AI_API_KEY is required for claude provider');
      }
      throw new Error('Claude provider not yet implemented');
    case 'openai':
      if (!process.env.AI_API_KEY) {
        throw new Error('AI_API_KEY is required for openai provider');
      }
      throw new Error('OpenAI provider not yet implemented');
    case 'mock':
    default:
      return new MockAIProvider();
  }
}
