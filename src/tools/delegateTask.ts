import { type Tool } from './index.js';
import { loadAgents } from '../core/subagents.js';
import { processAgentTurns } from '../core/agent_loop.js';
import { type Config } from '../core/config.js';
import { type Message } from '../core/types.js';

export const createDelegateTaskTool = (
    config: Config
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

            const initialConversation: Message[] = [{ role: 'user', content: taskPrompt }];
            const messageStream = processAgentTurns(config, {}, initialConversation, agentConfig);

            let finalContent = '';

            for await (const message of messageStream) {
                // Check for async iterable content using the language-native Symbol.asyncIterator.
                if (message.role === 'assistant' && message.content && typeof message.content[Symbol.asyncIterator] === 'function') {
                    let fullText = '';
                    for await (const chunk of message.content as AsyncIterable<string>) {
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