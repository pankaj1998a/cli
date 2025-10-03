import { type AiClient } from './index.js';

export class MockClient implements AiClient {
  async getCompletion(prompt: string): Promise<string> {
    return `Mock response for: "${prompt}"`;
  }
}