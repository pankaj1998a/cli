import React from 'react';
import { render } from 'ink';
import Chat from './components/Chat.js';
import OneShot from './components/OneShot.js';
import AgentOutput from './components/AgentOutput.js';
import { loadConfig } from './core/config.js';
import { getClient } from './clients/index.js';
import { processAgentTurns } from './core/agent_loop.js';
import { type Message } from './core/types.js';

export default async function (prompt: string, flags: any, isAgentMode: boolean) {
  const config = await loadConfig();

  if (prompt) {
    if (isAgentMode) {
        // For a non-interactive agent run, the conversation starts with a single user message.
        const initialConversation: Message[] = [{ role: 'user', content: prompt }];
        const messageStream = processAgentTurns(config, flags, initialConversation);

        render(React.createElement(AgentOutput, {
            messageStream,
        }));

    } else {
        // Simple non-interactive chat (`xcode "prompt"`)
        const provider = flags.provider || 'mock';
        const client = getClient(provider, config, flags);
        const response = await client.generateResponse([{ role: 'user', content: prompt }], []);
        render(React.createElement(OneShot, { prompt, responseStream: response.textStream }));
    }
  } else {
    // Interactive mode (`xcode`)
    // The Chat component now handles its own client creation and conversation logic.
    render(React.createElement(Chat, { initialPrompt: '' }));
  }
}