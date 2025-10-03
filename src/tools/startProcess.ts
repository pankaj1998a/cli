import { type Tool } from './index.js';
import { processManager } from '../core/process_manager.js';

export const startProcessTool: Tool = {
    name: 'start_process',
    description: 'Starts a new process in the background. Takes a command string as an argument and returns the process ID.',
    async execute(args: any[]): Promise<string> {
        const [command] = args;
        if (!command) {
            return 'Error: A command must be provided.';
        }
        try {
            const { id, message } = await processManager.start(command);
            return message;
        } catch (error) {
            return `Error starting process: ${error.message}`;
        }
    }
};