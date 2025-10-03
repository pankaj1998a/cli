import meow from 'meow';
import { loadConfig, saveConfig } from './core/config.js';
import { clearHistory } from './core/history.js';

const cli = meow(
  `
	Usage
	  $ xcode [prompt]
	  $ xcode agent [prompt]

	Commands
	  agent [prompt]                Run the AI agent with tool-use capabilities
	  config <provider> <apiKey>    Set API key for a provider
	  history                       Manage conversation history

	Options
		--provider, -p    AI provider to use (e.g., gemini, claude)
		--clear           Clear conversation history

	Examples
	  $ xcode "Hello, world!"
	  $ xcode agent "Read the file 'test.txt' and summarize it."
	  $ xcode config gemini YOUR_API_KEY
	  $ xcode history --clear
`,
  {
    importMeta: import.meta,
    flags: {
      provider: {
        type: 'string',
        shortFlag: 'p',
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

    if (command === 'config') {
        const [, provider, apiKey] = input;
        if (!provider || !apiKey) {
            console.error('Usage: xcode config <provider> <apiKey>');
            process.exit(1);
        }
        const config = await loadConfig();
        config[provider] = { apiKey };
        await saveConfig(config);
        console.log(`API key for ${provider} saved.`);
        return;
    }

    if (command === 'history' && flags.clear) {
        await clearHistory();
        console.log('Conversation history cleared.');
        return;
    }

    let prompt: string;
    let isAgentMode = false;

    if (command === 'agent') {
        isAgentMode = true;
        prompt = input.slice(1).join(' ');
    } else {
        prompt = input.join(' ');
    }

    // Show help if no prompt is provided in a non-TTY environment,
    // or if the agent is run without a prompt.
    if (!prompt && (!process.stdin.isTTY || isAgentMode)) {
        cli.showHelp();
        return;
    }

    // Dynamically import and run the chat interface
    const { default: run } = await import('./run.js');
    run(prompt, flags, isAgentMode);
}

main();