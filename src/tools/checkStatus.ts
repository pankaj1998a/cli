import { type Tool } from './index.js';
import { processManager } from '../core/process_manager.js';

export const checkStatusTool: Tool = {
    name: 'check_status',
    description: 'Checks the status of a background process and retrieves its log output. Takes a process ID as an argument.',
    async execute(args: any[]): Promise<string> {
        const [id] = args;
        const processId = Number(id);
        if (isNaN(processId)) {
            return 'Error: A valid process ID must be provided.';
        }
        try {
            return await processManager.checkStatus(processId);
        } catch (error) {
            return `Error checking status for process ${processId}: ${error.message}`;
        }
    }
};