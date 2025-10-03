import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { type Message } from './types.js';

const configDir = path.join(os.homedir(), '.config', 'xcode');
const historyFile = path.join(configDir, 'history.json');

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
    // When saving, only store the core fields, not the temporary 'id' used for UI keys.
    const messagesToSave = messages.map(({ role, content, tool_call_id }) => ({ role, content, tool_call_id }));
	await fs.writeFile(historyFile, JSON.stringify(messagesToSave, null, 2));
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