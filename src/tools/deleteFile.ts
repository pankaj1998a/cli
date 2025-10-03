import fs from 'fs/promises';
import { type Tool } from './index.js';

export const deleteFileTool: Tool = {
    name: 'delete_file',
    description: 'Deletes a specified file.',
    async execute(args: any[]): Promise<string> {
        const [filePath] = args;
        if (!filePath) {
            return 'Error: A file path must be provided.';
        }
        try {
            await fs.unlink(filePath);
            return `File "${filePath}" deleted successfully.`;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return `Error: File not found at "${filePath}"`;
            }
            throw error;
        }
    }
};