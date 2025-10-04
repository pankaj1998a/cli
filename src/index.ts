import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { loadConfig, saveConfig, getConfigPath } from './core/config.js';
import { clearHistory } from './core/history.js';
import { loadAgents } from './core/subagents.js';
import ListAgents from './components/ListAgents.js';
import AgentForm from './components/AgentForm.js';
import DeleteAgentConfirmation from './components/DeleteAgentConfirmation.js';
import os from 'os';
import path from 'path';

const cli = meow(
  `
	Usage
	  $ xcode [prompt]
	  $ xcode agent [sub-command] [prompt]

	Commands
	  agent [prompt]                  Run the default agent with tool-use capabilities
	  agent create                    Interactively create a new custom sub-agent
	  agent list                      List all available custom sub-agents
	  agent edit <name>               Interactively edit a custom sub-agent
	  agent delete <name>             Delete a custom sub-agent
	  config get                      Show the current configuration (keys redacted)
	  config path                     Show the path to the configuration file
	  config set <provider> <apiKey>  Set API key for a provider
	  history --clear                 Clear conversation history

	Options
		--provider, -p    AI provider to use (e.g., gemini, claude, nvidia)
		--model, -m       Specify a model to use for the selected provider
		--clear           Clear conversation history (legacy, use 'history --clear')

	Examples
	  $ xcode "Hello, world!"
	  $ xcode agent "Read 'test.txt' and summarize it." --provider openai
	  $ xcode agent create
	  $ xcode agent list
	  $ xcode agent edit code_reviewer
	  $ xcode agent delete code_reviewer
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
            render(React.createElement(AgentForm));
            return;
        }

        if (subCommand === 'edit') {
            const agentName = input[2];
            if (!agentName) {
                console.error('Error: Please provide the name of the agent to edit.');
                cli.showHelp();
                return;
            }
            const agents = await loadAgents();
            const agentToEdit = agents.find(a => a.name === agentName);
            if (!agentToEdit) {
                console.error(`Error: Agent "${agentName}" not found.`);
                return;
            }
            render(React.createElement(AgentForm, { agentToEdit }));
            return;
        }

        if (subCommand === 'delete') {
            const agentName = input[2];
            if (!agentName) {
                console.error('Error: Please provide the name of the agent to delete.');
                cli.showHelp();
                return;
            }
            render(React.createElement(DeleteAgentConfirmation, { agentName }));
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