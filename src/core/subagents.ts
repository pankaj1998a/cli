import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const configDir = path.join(os.homedir(), '.config', 'xcode');
const agentsFile = path.join(configDir, 'agents.json');

export interface SubAgent {
    name: string;
    persona: string;
    tools: string[]; // A list of tool names this agent can use
}

export async function loadAgents(): Promise<SubAgent[]> {
	try {
		await fs.mkdir(configDir, { recursive: true });
		const data = await fs.readFile(agentsFile, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return []; // No agents file yet, return empty array
		}
		throw error;
	}
}

export async function saveAgents(agents: SubAgent[]): Promise<void> {
	await fs.mkdir(configDir, { recursive: true });
	await fs.writeFile(agentsFile, JSON.stringify(agents, null, 2));
}