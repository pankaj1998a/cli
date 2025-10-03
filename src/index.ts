import meow from 'meow';
import { loadConfig, saveConfig } from './core/config.js';
import { clearHistory } from './core/history.js';

const cli = meow(
  `
	Usage
	  $ xcode [prompt]

	Commands
	  config <provider> <apiKey>  Set API key for a provider
	  history                       Manage conversation history

	Options
		--provider, -p  AI provider to use (e.g., gemini, claude)
		--name          Your name (for testing)
		--clear         Clear conversation history

	Examples
	  $ xcode "Hello, world!"
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
      name: {
        type: 'string',
      },
      clear: {
        type: 'boolean',
      },
    },
  }
);

async function main() {
  if (cli.input[0] === 'config') {
    const [, provider, apiKey] = cli.input;
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

  if (cli.input[0] === 'history' && cli.flags.clear) {
    await clearHistory();
    console.log('Conversation history cleared.');
    return;
  }

  const prompt = cli.input.join(' ');
  if (!prompt && process.stdin.isTTY) {
    cli.showHelp();
    return;
  }

  // Dynamically import and run the chat interface
  const { default: run } = await import('./run.js');
  run(prompt, cli.flags);
}

main();