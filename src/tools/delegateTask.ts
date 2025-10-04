import { type Tool } from './index.js';
import { loadAgents } from '../core/subagents.js';
import { processAgentTurns } from '../core/agent_loop.js';
import { type Config } from '../core/config.js';

export const createDelegateTaskTool = (
    config: Config,
    flags: { provider?: string, model?: string }
): Tool => {
    return {
        name: 'delegate_task',
        description: 'Delegates a specific task to a specialized sub-agent. Use this when a task requires a specific persona or a limited set of tools. Provide the agent name and a clear, detailed prompt for the task.',
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

            // Run the sub-agent loop, passing the necessary config for it
            // to create its own, correctly-configured AI client.
            const finalMessages = await processAgentTurns(config, flags, taskPrompt, agentConfig);

            // Extract and return the final response from the sub-agent
            const finalResponse = finalMessages[finalMessages.length - 1];
            if (finalResponse && finalResponse.role === 'assistant' && typeof finalResponse.content === 'string') {
                return `Sub-agent "${agentName}" responded: ${finalResponse.content}`;
            }

            return `Sub-agent "${agentName}" finished without a final text response.`;
        }
    };
};