import fs from 'fs/promises';
import { type Tool } from './index.js';

export const editFileTool: Tool = {
    name: 'edit_file',
    description: 'Performs a targeted search and replace on a specified file. Provide the file path, the exact text to search for, and the text to replace it with.',
    async execute(args: any[]): Promise<string> {
        const [filePath, searchText, replaceText] = args;
        if (!filePath || searchText === undefined || replaceText === undefined) {
            return 'Error: `filePath`, `searchText`, and `replaceText` are required arguments.';
        }

        try {
            const originalContent = await fs.readFile(filePath, 'utf-8');
            if (!originalContent.includes(searchText)) {
                return `Error: The search text was not found in the file "${filePath}". No changes were made.`;
            }
            const newContent = originalContent.replace(searchText, replaceText);
            await fs.writeFile(filePath, newContent, 'utf-8');
            return `File "${filePath}" has been successfully edited.`;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return `Error: File not found at "${filePath}".`;
            }
            return `Error editing file: ${error.message}`;
        }
    }
};