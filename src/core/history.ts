import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const configDir = path.join(os.homedir(), '.config', 'xcode');
const historyFile = path.join(configDir, 'history.json');

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export async function loadHistory(): Promise<Message[]> {
	try {
		await fs.mkdir(configDir, { recursive: true });
		const data = await fs.readFile(historyFile, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}
}

export async function saveHistory(messages: Message[]): Promise<void> {
	await fs.mkdir(configDir, { recursive: true });
	await fs.writeFile(historyFile, JSON.stringify(messages, null, 2));
}

export async function clearHistory(): Promise<void> {
    try {
        await fs.unlink(historyFile);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, so nothing to do
            return;
        }
        throw error;
    }
}