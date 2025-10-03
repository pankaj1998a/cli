import { type Message } from './types.js';
import { initializeToolRunner } from './agent.js';
import { type SubAgent } from './subagents.js';
import { type Config } from './config.js';
import { getClient } from '../clients/index.js';

export async function processAgentTurns(
    config: Config,
    flags: { provider?: string, model?: string },
    prompt: string,
    agentConfig?: SubAgent,
): Promise<Message[]> {
    // Determine the provider and model, with agent-specific settings taking precedence.
    const provider = agentConfig?.provider || flags.provider || 'mock';
    const model = agentConfig?.model || flags.model;

    // Create the appropriate AI client for this specific agent turn.
    const client = getClient(provider, config, { model });

    const toolRunner = agentConfig
        ? initializeToolRunner(client, agentConfig.tools)
        : initializeToolRunner(client);

    const messages: Message[] = [];
    if (agentConfig?.persona) {
        messages.push({ role: 'assistant', content: agentConfig.persona });
    }
    messages.push({ role: 'user', content: prompt });

    const maxTurns = 5; // Prevent infinite loops

    for (let turn = 0; turn < maxTurns; turn++) {
        const toolSchemas = toolRunner.getToolSchemas();
        const response = await client.generateResponse(messages, toolSchemas);

        if (response.isToolCall && response.toolCalls) {
            messages.push({ role: 'assistant', content: response.toolCalls });

            for (const toolCall of response.toolCalls) {
                const args = JSON.parse(toolCall.function.arguments);
                const argsArray = Object.values(args);
                const toolResult = await toolRunner.run(toolCall.function.name, argsArray);

                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: toolResult,
                });
            }
        } else {
            // It's a final text response
            if (response.textStream) {
                let fullText = '';
                for await (const chunk of response.textStream) {
                    fullText += chunk;
                }
                messages.push({ role: 'assistant', content: fullText });
            } else {
                 messages.push({ role: 'assistant', content: "[No response from AI]" });
            }
            return messages;
        }
    }

    messages.push({ role: 'assistant', content: "The agent reached the maximum number of turns without providing a final answer." });
    return messages;
}