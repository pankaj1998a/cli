import fs from 'fs/promises';
import { type Tool } from './index.js';

export const readFileTool: Tool = {
    name: 'read_file',
    description: 'Reads the entire content of a specified file.',
    async execute(args: any[]): Promise<string> {
        const [filePath] = args;
        if (!filePath) {
            return 'Error: A file path must be provided.';
        }
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return `Content of "${filePath}":\n\n${content}`;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return `Error: File not found at "${filePath}"`;
            }
            throw error;
        }
    }
};