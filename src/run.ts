import React from 'react';
import { render } from 'ink';
import Chat from './components/Chat.js';
import OneShot from './components/OneShot.js';
import AgentOutput from './components/AgentOutput.js';
import { loadConfig } from './core/config.js';
import { getClient } from './clients/index.js';
import { processAgentTurns } from './core/agent_loop.js';
import { type AiResponse } from './core/types.js';

export default async function (prompt: string, flags: any, isAgentMode: boolean) {
  const config = await loadConfig();
  const provider = flags.provider || 'mock';
  // Pass the full flags object to the client factory
  const client = getClient(provider, config, flags);

  if (prompt) {
    if (isAgentMode) {
        // Non-interactive agent run (`xcode agent "prompt"`)
        const toolProcessingHistory = await processAgentTurns(client, prompt);
        const finalResponseStream: AiResponse = await client.generateResponse(toolProcessingHistory, []);
        render(React.createElement(AgentOutput, {
            initialMessages: toolProcessingHistory,
            finalResponseStream
        }));
    } else {
        // Simple non-interactive chat (`xcode "prompt"`)
        const response = await client.generateResponse([{ role: 'user', content: prompt }], []);
        render(React.createElement(OneShot, { prompt, responseStream: response.textStream }));
    }
  } else {
    // Interactive mode (`xcode`)
    render(React.createElement(Chat, { client, initialPrompt: '' }));
  }
}