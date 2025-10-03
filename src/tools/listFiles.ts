import fs from 'fs/promises';
import path from 'path';
import { type Tool } from './index.js';

export const listFilesTool: Tool = {
    name: 'list_files',
    description: 'Lists all files and directories in a specified path. Defaults to the current directory.',
    async execute(args: any[]): Promise<string> {
        const targetPath = args[0] || '.';
        try {
            const files = await fs.readdir(targetPath, { withFileTypes: true });
            const fileList = files.map(file => {
                const type = file.isDirectory() ? 'directory' : 'file';
                return `${file.name} (${type})`;
            });
            return `Contents of "${path.resolve(targetPath)}":\n${fileList.join('\n')}`;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return `Error: Directory not found at "${targetPath}"`;
            }
            throw error;
        }
    }
};