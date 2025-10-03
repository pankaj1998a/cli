import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { loadConfig, saveConfig } from './core/config.js';
import { clearHistory } from './core/history.js';
import { loadAgents } from './core/subagents.js';
import ListAgents from './components/ListAgents.js';
import os from 'os';
import path from 'path';

const cli = meow(
  `
	Usage
	  $ xcode [prompt]
	  $ xcode agent [sub-command] [prompt]

	Commands
	  agent [prompt]                Run the default agent with tool-use capabilities
	  agent create                  Instructions to create a new custom sub-agent
	  agent list                    List all available custom sub-agents
	  config <provider> <apiKey>    Set API key for a provider
	  history                       Manage conversation history

	Options
		--provider, -p    AI provider to use (e.g., gemini, claude)
		--model, -m       Specify a model to use for the selected provider
		--clear           Clear conversation history

	Examples
	  $ xcode "Hello, world!"
	  $ xcode agent "Read the file 'test.txt' and summarize it." --provider openai --model gpt-4
	  $ xcode agent create
	  $ xcode agent list
`,
  {
    importMeta: import.meta,
    flags: {
      provider: {
        type: 'string',
        shortFlag: 'p',
      },
      model: {
        type: 'string',
        shortFlag: 'm',
      },
      clear: {
        type: 'boolean',
      },
    },
  }
);

async function main() {
    const { input, flags } = cli;
    const command = input[0];
    const subCommand = input[1];

    if (command === 'config') {
        const [, provider, apiKey] = input;
        if (!provider || !apiKey) { cli.showHelp(); return; }
        const config = await loadConfig();
        if(!config[provider]) config[provider] = { apiKey };
        else config[provider]!.apiKey = apiKey;
        await saveConfig(config);
        console.log(`API key for ${provider} saved.`);
        return;
    }

    if (command === 'history' && flags.clear) {
        await clearHistory();
        console.log('Conversation history cleared.');
        return;
    }

    if (command === 'agent') {
        if (subCommand === 'list') {
            const agents = await loadAgents();
            render(React.createElement(ListAgents, { agents }));
            return;
        }

        if (subCommand === 'create') {
            const agentsFilePath = path.join(os.homedir(), '.config', 'xcode', 'agents.json');
            console.log(`
To create a new sub-agent, please manually edit the configuration file.

File Path: ${agentsFilePath}

Add an agent object to the JSON array in that file. Use the 'type' field to specify 'internal' or 'external'.

--- Example for an INTERNAL agent (uses persona and tools) ---
{
  "name": "code_reviewer",
  "type": "internal",
  "persona": "You are an expert code reviewer. You analyze code for bugs, style issues, and potential improvements.",
  "tools": ["read_file", "list_files"]
}

--- Example for an EXTERNAL agent (executes a command) ---
{
  "name": "external_linter",
  "type": "external",
  "command": "eslint {{prompt}}"
}

Available tools for internal agents: list_files, read_file, create_file, delete_file, execute_command.
For external agents, use {{prompt}} as a placeholder for the task input.
`);
            return;
        }

        const prompt = input.slice(1).join(' ');
        if (!prompt) { cli.showHelp(); return; }
        const { default: run } = await import('./run.js');
        run(prompt, flags, true);
        return;
    }

    const prompt = input.join(' ');
    if (!prompt && process.stdin.isTTY) {
        const { default: run } = await import('./run.js');
        run('', flags, false);
    } else if (prompt) {
        const { default: run } = await import('./run.js');
        run(prompt, flags, false);
    } else {
        cli.showHelp();
    }
}

main();