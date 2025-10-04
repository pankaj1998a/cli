import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { type Message } from './types.js';

const configDir = path.join(os.homedir(), '.config', 'xcode');
const historyDir = path.join(configDir, 'history');
const defaultHistoryFile = path.join(historyDir, 'default.json');

// Ensures the history directory exists.
const ensureHistoryDir = async () => fs.mkdir(historyDir, { recursive: true });

// Loads the default conversation history.
export async function loadHistory(): Promise<Message[]> {
	try {
		await ensureHistoryDir();
		const data = await fs.readFile(defaultHistoryFile, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return []; // No history file yet, return empty array.
		}
		throw error;
	}
}

// Saves messages to the default conversation history file.
export async function saveHistory(messages: Message[]): Promise<void> {
	await ensureHistoryDir();
    const messagesToSave = messages.map(({ role, content, tool_call_id }) => ({ role, content, tool_call_id }));
	await fs.writeFile(defaultHistoryFile, JSON.stringify(messagesToSave, null, 2));
}

// Clears the default conversation history.
export async function clearHistory(): Promise<void> {
    try {
        await fs.unlink(defaultHistoryFile);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

// --- Checkpointing Functions ---

// Lists all saved history checkpoints.
export async function listHistories(): Promise<string[]> {
    await ensureHistoryDir();
    const files = await fs.readdir(historyDir);
    return files
        .filter(file => file.endsWith('.json') && file !== 'default.json')
        .map(file => file.replace('.json', ''));
}

// Saves the current conversation as a named checkpoint.
export async function saveHistoryAs(name: string): Promise<void> {
    if (!name || name === 'default') {
        throw new Error('Invalid checkpoint name.');
    }
    await ensureHistoryDir();
    const destinationFile = path.join(historyDir, `${name}.json`);
    try {
        await fs.copyFile(defaultHistoryFile, destinationFile);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error("There is no active conversation to save.");
        }
        throw error;
    }
}

// Loads a named checkpoint as the current conversation.
export async function loadHistoryFrom(name: string): Promise<void> {
    if (!name || name === 'default') {
        throw new Error('Invalid checkpoint name.');
    }
    await ensureHistoryDir();
    const sourceFile = path.join(historyDir, `${name}.json`);
    try {
        await fs.copyFile(sourceFile, defaultHistoryFile);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Checkpoint "${name}" not found.`);
        }
        throw error;
    }
}

// Deletes a named checkpoint.
export async function deleteHistoryCheckpoint(name: string): Promise<void> {
    if (!name || name === 'default') {
        throw new Error('Invalid checkpoint name. Cannot delete the default history.');
    }
    const checkpointFile = path.join(historyDir, `${name}.json`);
    try {
        await fs.unlink(checkpointFile);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Checkpoint "${name}" not found.`);
        }
        throw error;
    }
}