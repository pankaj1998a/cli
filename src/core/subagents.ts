import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const configDir = path.join(os.homedir(), '.config', 'xcode');
const agentsFile = path.join(configDir, 'agents.json');

interface AgentBase {
    name: string;
}

export interface InternalAgent extends AgentBase {
    type: 'internal';
    persona: string;
    tools: string[]; // A list of tool names this agent can use
}

export interface ExternalAgent extends AgentBase {
    type: 'external';
    command: string; // The command to execute for this agent
}

export type SubAgent = InternalAgent | ExternalAgent;


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