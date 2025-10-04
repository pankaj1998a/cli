import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const configDir = path.join(os.homedir(), '.config', 'xcode');
const configFile = path.join(configDir, 'config.json');

export interface Config {
	[provider: string]: {
		apiKey: string;
		defaultModel?: string;
	};
}

export async function loadConfig(): Promise<Config> {
	try {
		await fs.mkdir(configDir, { recursive: true });
		const data = await fs.readFile(configFile, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return {};
		}
		throw error;
	}
}

export async function saveConfig(config: Config): Promise<void> {
	await fs.mkdir(configDir, { recursive: true });
	await fs.writeFile(configFile, JSON.stringify(config, null, 2));
}

export function getConfigPath(): string {
	return configFile;
}