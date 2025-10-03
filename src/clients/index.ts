import { type Config } from '../core/config.js';
import { type AiClient } from '../core/types.js';
import { MockClient } from './mock.js';
import { GeminiClient } from './gemini.js';
import { OpenAIClient } from './openai.js';
import { ClaudeClient } from './claude.js';
import { GroqClient } from './groq.js';
import { OpenRouterClient } from './openrouter.js';
import { QwenClient } from './qwen.js';

export * from '../core/types.js';

export function getClient(provider: string, config: Config): AiClient {
  const getApiKey = (providerName: string) => {
    const key = config[providerName]?.apiKey;
    if (!key) {
      throw new Error(`API key for ${providerName} not found. Please run 'xcode config ${providerName} <YOUR_API_KEY>'.`);
    }
    return key;
  };

  switch (provider) {
    case 'mock':
      return new MockClient();
    case 'gemini':
      return new GeminiClient(getApiKey('gemini'));
    case 'openai':
      return new OpenAIClient(getApiKey('openai'));
    case 'claude':
      return new ClaudeClient(getApiKey('claude'));
    case 'groq':
      return new GroqClient(getApiKey('groq'));
    case 'openrouter':
      return new OpenRouterClient(getApiKey('openrouter'));
    case 'qwen':
        return new QwenClient(getApiKey('qwen'));
    default:
      throw new Error(`Unknown or unsupported provider: "${provider}"`);
  }
}