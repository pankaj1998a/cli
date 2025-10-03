import { type AiClient, type Message } from './types.js';
import { initializeToolRunner } from './agent.js';
import { type SubAgent } from './subagents.js';

export async function processAgentTurns(
    client: AiClient,
    prompt: string,
    agentConfig?: SubAgent,
): Promise<Message[]> {
    const toolRunner = agentConfig
        ? initializeToolRunner(client, agentConfig.tools)
        : initializeToolRunner(client);

    const messages: Message[] = [];
    if (agentConfig?.persona) {
        // This is a simplified way to handle system prompts.
        // A more robust solution might add a 'system' role to the Message type.
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