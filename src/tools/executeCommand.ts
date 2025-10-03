import { $ } from 'bun';
import { type Tool } from './index.js';

export const executeCommandTool: Tool = {
    name: 'execute_command',
    description: 'Executes a shell command and returns its standard output. Use this for tasks like running tests, installing packages, etc.',
    async execute(args: any[]): Promise<string> {
        const [command] = args;
        if (!command) {
            return 'Error: A command must be provided.';
        }
        try {
            const { stdout, stderr } = await $.quiet`${$.raw(command)}`;
            let output = '';
            if (stdout) {
                output += `STDOUT:\n${stdout.toString()}`;
            }
            if (stderr) {
                output += `\nSTDERR:\n${stderr.toString()}`;
            }
            return output || 'Command executed successfully with no output.';

        } catch (error) {
            return `Error executing command: ${error.message}\nSTDOUT:\n${error.stdout?.toString()}\nSTDERR:\n${error.stderr?.toString()}`;
        }
    }
};