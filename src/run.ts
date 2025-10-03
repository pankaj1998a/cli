import React from 'react';
import { render } from 'ink';
import Chat from './components/Chat.js';
import OneShot from './components/OneShot.js';
import { loadConfig } from './core/config.js';
import { getClient } from './clients/index.js';

export default async function (prompt: string, flags: any) {
  const config = await loadConfig();
  const provider = flags.provider || 'mock';
  const client = getClient(provider, config);

  if (prompt) {
    // Non-interactive mode
    render(React.createElement(OneShot, { client, prompt }));
  } else {
    // Interactive mode
    render(React.createElement(Chat, { ...flags, client, initialPrompt: prompt }));
  }
}