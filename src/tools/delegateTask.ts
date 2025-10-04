import { type Tool } from './index.js';
import { loadAgents } from '../core/subagents.js';
import { processAgentTurns } from '../core/agent_loop.js';
import { type Config } from '../core/config.js';
import { isAsyncIterable } from 'util/types';
import { type Message } from '../core/types.js';

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

            // The sub-agent's conversation starts with a single user message.
            const initialConversation: Message[] = [{ role: 'user', content: taskPrompt }];

            // When delegating, we pass empty flags `{}` to ensure the sub-agent uses its own
            // configuration from agents.json, rather than inheriting the parent's CLI flags.
            const messageStream = processAgentTurns(config, {}, initialConversation, agentConfig);

            let finalContent = '';

            for await (const message of messageStream) {
                if (message.role === 'assistant' && isAsyncIterable(message.content)) {
                    let fullText = '';
                    for await (const chunk of message.content) {
                        fullText += chunk;
                    }
                    finalContent = fullText;
                } else if (message.role === 'assistant' && typeof message.content === 'string') {
                    finalContent = message.content;
                }
            }

            if (finalContent) {
                return `Sub-agent "${agentName}" responded: ${finalContent}`;
            }

            return `Sub-agent "${agentName}" finished without a final text response.`;
        }
    };
};