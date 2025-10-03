import { type Config } from '../core/config.js';
import { type AiClient } from '../core/types.js';
import { MockClient } from './mock.js';
import { GeminiClient } from './gemini.js';

export * from '../core/types.js';

export function getClient(provider: string, config: Config): AiClient {
  switch (provider) {
    case 'mock':
      return new MockClient();
    case 'gemini':
      const apiKey = config[provider]?.apiKey;
      if (!apiKey) {
        throw new Error(`API key for Gemini not found. Please run 'xcode config gemini <YOUR_API_KEY>'.`);
      }
      return new GeminiClient(apiKey);
    default:
      throw new Error(`Unknown or unsupported provider: "${provider}"`);
  }
}