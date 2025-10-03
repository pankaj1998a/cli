import { type Tool } from './index.js';
import { processManager } from '../core/process_manager.js';

export const stopProcessTool: Tool = {
    name: 'stop_process',
    description: 'Stops a background process. Takes a process ID as an argument.',
    async execute(args: any[]): Promise<string> {
        const [id] = args;
        const processId = Number(id);
        if (isNaN(processId)) {
            return 'Error: A valid process ID must be provided.';
        }
        try {
            return processManager.stop(processId);
        } catch (error) {
            return `Error stopping process ${processId}: ${error.message}`;
        }
    }
};