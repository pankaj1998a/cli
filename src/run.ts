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
        // processAgentTurns is now an async generator. We pass the generator
        // directly to the UI component, which will handle rendering the stream.
        const messageStream = processAgentTurns(config, flags, prompt);

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
    const provider = flags.provider || 'mock';
    const client = getClient(provider, config, flags);
    render(React.createElement(Chat, { client, initialPrompt: '' }));
  }
}