import { $ } from 'bun';
import { type Tool } from './index.js';
import { type AiClient } from '../core/types.js';
import { loadAgents } from '../core/subagents.js';
// The agent loop is no longer called from here, breaking the cycle.

export const createDelegateTaskTool = (client: AiClient): Tool => {
    return {
        name: 'delegate_task',
        description: 'Delegates a specific task to a specialized sub-agent (internal or external). Returns a signal to the main agent to execute the delegation.',
        async execute(args: any[]): Promise<string> {
            const [agentName, taskPrompt] = args;
            if (!agentName || !taskPrompt) {
                return 'Error: Both agent_name and task_prompt are required.';
            }

            const allAgents = await loadAgents();
            const agentConfig = allAgents.find(a => a.name === agentName);

            if (!agentConfig) {
                return `Error: Sub-agent with name "${agentName}" not found.`;
            }

            // Return a structured signal instead of executing the loop here.
            return JSON.stringify({
                type: 'delegation',
                agentName,
                taskPrompt,
                agentConfig, // Pass the config along
            });
        }
    };
};