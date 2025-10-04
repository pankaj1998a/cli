import { type Message } from './types.js';
import { initializeToolRunner } from './agent.js';
import { type SubAgent } from './subagents.js';
import { type Config } from './config.js';
import { getClient } from '../clients/index.js';

export async function* processAgentTurns(
    config: Config,
    flags: { provider?: string, model?: string },
    prompt: string,
    agentConfig?: SubAgent,
): AsyncGenerator<Message> {
    const provider = agentConfig?.provider || flags.provider || 'mock';
    const model = agentConfig?.model || flags.model;
    const client = getClient(provider, config, { model });

    // Initialize the tool runner with the correct client and tools for this agent.
    // Note: The `client` is passed here for the `delegate_task` tool, which needs it to spawn sub-agents.
    // This is a bit of a legacy design; a better approach would be to pass config/flags to the tool initializer.
    const toolRunner = agentConfig
        ? initializeToolRunner(config, flags, agentConfig.tools)
        : initializeToolRunner(config, flags);

    const messages: Message[] = [];

    if (agentConfig?.persona) {
        const personaMsg = { role: 'system' as const, content: agentConfig.persona };
        messages.push(personaMsg);
        yield personaMsg;
    }

    const userMsg = { role: 'user' as const, content: prompt };
    messages.push(userMsg);
    yield userMsg;

    const maxTurns = 5;

    for (let turn = 0; turn < maxTurns; turn++) {
        const toolSchemas = toolRunner.getToolSchemas();
        const response = await client.generateResponse(messages, toolSchemas);

        if (response.isToolCall && response.toolCalls) {
            const assistantMsg = { role: 'assistant' as const, content: response.toolCalls };
            messages.push(assistantMsg);
            yield assistantMsg;

            for (const toolCall of response.toolCalls) {
                const args = JSON.parse(toolCall.function.arguments);
                const argsArray = Object.values(args);
                const toolResult = await toolRunner.run(toolCall.function.name, argsArray);

                const toolMsg = {
                    role: 'tool' as const,
                    tool_call_id: toolCall.id,
                    content: toolResult,
                };
                messages.push(toolMsg);
                yield toolMsg;
            }
        } else {
            // It's a final text response, which might be a stream.
            if (response.textStream) {
                // Yield a final assistant message with the stream as content.
                // The UI component will be responsible for consuming this stream.
                yield { role: 'assistant', content: response.textStream };
            } else {
                yield { role: 'assistant', content: "[No response from AI]" };
            }
            return; // End of conversation.
        }
    }

    yield { role: 'assistant', content: "The agent reached the maximum number of turns without providing a final answer." };
}