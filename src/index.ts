import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { loadConfig, saveConfig, getConfigPath } from './core/config.js';
import {
    clearHistory,
    listHistories,
    saveHistoryAs,
    loadHistoryFrom,
    deleteHistoryCheckpoint
} from './core/history.js';
import { loadAgents } from './core/subagents.js';
import ListAgents from './components/ListAgents.js';
import AgentForm from './components/AgentForm.js';
import DeleteAgentConfirmation from './components/DeleteAgentConfirmation.js';

const cli = meow(
  `
	Usage
	  $ xcode [prompt]
	  $ xcode agent [sub-command] [prompt]
    $ cat <file> | xcode [prompt]

	Commands
	  agent [prompt]                  Run the default agent with tool-use capabilities
	  agent create                    Interactively create a new custom sub-agent
	  agent list                      List all available custom sub-agents
	  agent edit <name>               Interactively edit a custom sub-agent
	  agent delete <name>             Delete a custom sub-agent
	  config get                      Show the current configuration (keys redacted)
	  config path                     Show the path to the configuration file
	  config set <provider> <apiKey>  Set API key for a provider
	  history list                    List all saved conversation checkpoints
	  history save <name>             Save the current conversation as a checkpoint
	  history load <name>             Load a conversation from a checkpoint
	  history delete <name>           Delete a conversation checkpoint
	  history clear                   Clear the current conversation history

	Options
		--provider, -p    AI provider to use (e.g., gemini, claude, nvidia)
		--model, -m       Specify a model to use for the selected provider

	Examples
	  $ xcode "Hello, world!"
	  $ xcode agent "Read 'test.txt' and summarize it." --provider openai
	  $ xcode agent create
	  $ xcode agent list
	  $ xcode agent edit code_reviewer
	  $ xcode agent delete code_reviewer
	  $ xcode config set openai sk-xxxxxxxx
	  $ xcode config get
    $ cat file.js | xcode "Refactor this code."
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
    },
  }
);

// Helper to read from stdin if available.
async function readStdin(): Promise<string> {
    if (process.stdin.isTTY) {
        return '';
    }
    let result = '';
    for await (const chunk of process.stdin) {
        result += chunk;
    }
    return result;
}

async function main() {
    const { input, flags } = cli;
    const command = input[0];
    const subCommand = input[1];

    if (command === 'config') {
        const name = input[2];
        const value = input[3];
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
            if (!name || !value) {
                console.error('Error: Please provide both a provider/key and a value for the "set" command.');
                cli.showHelp();
                return;
            }
            const config = await loadConfig();
            if (!config[name]) {
                config[name] = {};
            }
            config[name].apiKey = value;
            await saveConfig(config);
            console.log(`Configuration for ${name} saved.`);
            return;
        }

        console.error('Invalid "config" command. Use "get", "path", or "set".');
        cli.showHelp();
        return;
    }

    if (command === 'history') {
        const name = input[2];
        try {
            switch (subCommand) {
                case 'list':
                    const histories = await listHistories();
                    if (histories.length === 0) {
                        console.log('No saved conversation checkpoints found.');
                    } else {
                        console.log('Saved conversation checkpoints:');
                        histories.forEach(h => console.log(`- ${h}`));
                    }
                    break;
                case 'save':
                    if (!name) {
                        console.error('Error: A name is required to save the history checkpoint.');
                        return;
                    }
                    await saveHistoryAs(name);
                    console.log(`Conversation saved as "${name}".`);
                    break;
                case 'load':
                    if (!name) {
                        console.error('Error: A name is required to load a history checkpoint.');
                        return;
                    }
                    await loadHistoryFrom(name);
                    console.log(`Conversation "${name}" loaded. Start a new session to use it.`);
                    break;
                case 'delete':
                    if (!name) {
                        console.error('Error: A name is required to delete a history checkpoint.');
                        return;
                    }
                    await deleteHistoryCheckpoint(name);
                    console.log(`Conversation checkpoint "${name}" deleted.`);
                    break;
                case 'clear':
                    await clearHistory();
                    console.log('Current conversation history cleared.');
                    break;
                default:
                    console.error('Invalid history command. Use list, save, load, delete, or clear.');
                    cli.showHelp();
                    break;
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
        return;
    }

    const stdinContent = await readStdin();

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

        const agentCliInput = input.slice(1).join(' ');
        let agentPrompt = agentCliInput;
        if (stdinContent) {
            agentPrompt = `The following content was piped into the command:\n\n${stdinContent}\n\n---\n\n${agentCliInput}`;
        }

        if (!agentPrompt.trim()) {
            cli.showHelp();
            return;
        }

        const { default: run } = await import('./run.js');
        run(agentPrompt, flags, true);
        return;
    }

    // Standard chat mode logic
    const cliInput = input.join(' ');
    let finalPrompt = cliInput;
    if (stdinContent) {
        finalPrompt = `The following content was piped into the command:\n\n${stdinContent}\n\n---\n\n${cliInput}`;
    }

    if (!finalPrompt.trim() && process.stdin.isTTY) {
        // Interactive mode (no prompt from cli or stdin)
        const { default: run } = await import('./run.js');
        run('', flags, false);
    } else if (finalPrompt.trim()) {
        // Non-interactive mode (prompt from cli, stdin, or both)
        const { default: run } = await import('./run.js');
        run(finalPrompt, flags, false);
    } else {
        cli.showHelp();
    }
}

main();