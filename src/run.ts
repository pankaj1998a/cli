import React from 'react';
import { render } from 'ink';
import Chat from './components/Chat.js';
import OneShot from './components/OneShot.js';
import AgentOutput from './components/AgentOutput.js';
import { loadConfig } from './core/config.js';
import { getClient } from './clients/index.js';
import { runAgent } from './core/agent.js';

export default async function (prompt: string, flags: any, isAgentMode: boolean) {
  const config = await loadConfig();
  const provider = flags.provider || 'mock';
  const client = getClient(provider, config);

  if (isAgentMode) {
    const conversationHistory = await runAgent(client, prompt);
    render(React.createElement(AgentOutput, { messages: conversationHistory }));

  } else if (prompt) {
    // Non-interactive mode (simple prompt-response)
    const response = await client.generateResponse([{ role: 'user', content: prompt }], []);
    render(React.createElement(OneShot, { prompt, response: response.text || "No response." }));

  } else {
    // Interactive mode (`xcode` with no prompt)
    render(React.createElement(Chat, { ...flags, client, initialPrompt: prompt, isAgentMode }));
  }
}