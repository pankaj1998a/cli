import { type Config } from '../core/config.js';
import { MockClient } from './mock.js';

export interface AiClient {
  getCompletion(prompt: string): Promise<string>;
}

export function getClient(provider: string, config: Config): AiClient {
  if (provider === 'mock') {
    return new MockClient();
  }
  throw new Error(`Unknown provider: ${provider}`);
}