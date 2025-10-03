import React from 'react';
import { render } from 'ink';
import Chat from './components/Chat.js';
import OneShot from './components/OneShot.js';
import AgentOutput from './components/AgentOutput.js';
import { loadConfig } from './core/config.js';
import { getClient } from './clients/index.js';
import { processAgentTurns } from './core/agent_loop.js';

export default async function (prompt: string, flags: any, isAgentMode: boolean) {
  const config = await loadConfig();

  if (prompt) {
    if (isAgentMode) {
        // Non-interactive agent run (`xcode agent "prompt"`)
        // The new processAgentTurns handles the entire loop, including client creation.
        const finalMessages = await processAgentTurns(config, flags, prompt);

        // The AgentOutput component now simply renders the final message history.
        render(React.createElement(AgentOutput, {
            messages: finalMessages,
        }));

    } else {
        // Simple non-interactive chat (`xcode "prompt"`)
        // Create a client on-the-fly for this one-shot request.
        const provider = flags.provider || 'mock';
        const client = getClient(provider, config, flags);
        const response = await client.generateResponse([{ role: 'user', content: prompt }], []);
        render(React.createElement(OneShot, { prompt, responseStream: response.textStream }));
    }
  } else {
    // Interactive mode (`xcode`)
    // Create the initial client for the interactive session.
    const provider = flags.provider || 'mock';
    const client = getClient(provider, config, flags);
    render(React.createElement(Chat, { client, initialPrompt: '' }));
  }
}