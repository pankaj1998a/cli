import fs from 'fs/promises';
import path from 'path';
import { type Tool } from './index.js';

export const createFileTool: Tool = {
    name: 'create_file',
    description: 'Creates a new file at a specified path with the given content. It can also create directories if they do not exist.',
    async execute(args: any[]): Promise<string> {
        const [filePath, content] = args;
        if (!filePath) {
            return 'Error: A file path must be provided.';
        }
        if (content === undefined) {
            return 'Error: Content for the file must be provided.';
        }

        try {
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, content, 'utf-8');
            return `File "${filePath}" created successfully.`;
        } catch (error) {
            return `Error creating file: ${error.message}`;
        }
    }
};