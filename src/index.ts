import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { loadConfig, saveConfig, getConfigPath } from './core/config.js';
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
	  agent [prompt]                  Run the default agent with tool-use capabilities
	  agent create                    Instructions to create a new custom sub-agent
	  agent list                      List all available custom sub-agents
	  config get                      Show the current configuration (keys redacted)
	  config path                     Show the path to the configuration file
	  config set <provider> <apiKey>  Set API key for a provider
	  history --clear                 Clear conversation history

	Options
		--provider, -p    AI provider to use (e.g., gemini, claude)
		--model, -m       Specify a model to use for the selected provider
		--clear           Clear conversation history (legacy, use 'history --clear')

	Examples
	  $ xcode "Hello, world!"
	  $ xcode agent "Read 'test.txt' and summarize it." --provider openai
	  $ xcode agent create
	  $ xcode agent list
	  $ xcode config set openai sk-xxxxxxxx
	  $ xcode config get
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
        if (subCommand === 'get') {
            const config = await loadConfig();
            const redactedConfig = { ...config };
            for (const provider in redactedConfig) {
                if (redactedConfig[provider]?.apiKey) {
                    redactedConfig[provider].apiKey = '********';
                }
            }
            console.log(JSON.stringify(redactedConfig, null, 2));
            return;
        }

        if (subCommand === 'path') {
            console.log(getConfigPath());
            return;
        }

        if (subCommand === 'set') {
            const provider = input[2];
            const apiKey = input[3];
            if (!provider || !apiKey) {
                console.error('Error: Please provide both a provider and an API key for the "set" command.');
                cli.showHelp();
                return;
            }
            const config = await loadConfig();
            if (!config[provider]) {
                config[provider] = {};
            }
            config[provider].apiKey = apiKey;
            await saveConfig(config);
            console.log(`API key for ${provider} saved.`);
            return;
        }

        // If 'config' is called with no valid subcommand
        console.error('Invalid "config" command. Use "get", "path", or "set".');
        cli.showHelp();
        return;
    }

    if ((command === 'history' && flags.clear) || (flags.clear && !command)) {
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

Add a new agent object to the JSON array in that file. Here is an example:

[
  {
    "name": "code_reviewer",
    "persona": "You are an expert code reviewer. You analyze code for bugs, style issues, and potential improvements.",
    "provider": "claude",
    "model": "claude-3-opus-20240229",
    "tools": [
      "read_file",
      "list_files"
    ]
  }
]

Available tools are: list_files, read_file, create_file, delete_file, execute_command.
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