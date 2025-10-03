import { $ } from 'bun';
import { type AiClient, type Message, type SubAgent } from './types.js';
import { initializeToolRunner } from './agent.js';

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
        messages.push({ role: 'assistant', content: agentConfig.persona });
    }
    messages.push({ role: 'user', content: prompt });

    const maxTurns = 5;

    for (let turn = 0; turn < maxTurns; turn++) {
        const toolSchemas = toolRunner.getToolSchemas();
        const response = await client.generateResponse(messages, toolSchemas);

        if (response.isToolCall && response.toolCalls) {
            messages.push({ role: 'assistant', content: response.toolCalls });

            for (const toolCall of response.toolCalls) {
                const args = JSON.parse(toolCall.function.arguments);
                const argsArray = Object.values(args);
                let toolResult = await toolRunner.run(toolCall.function.name, argsArray);

                // Check for delegation signal
                try {
                    const parsedResult = JSON.parse(toolResult);
                    if (parsedResult.type === 'delegation') {
                        const { agentName, taskPrompt, agentConfig: subAgentConfig } = parsedResult;

                        if (subAgentConfig.type === 'internal') {
                            const subAgentHistory = await processAgentTurns(client, taskPrompt, subAgentConfig);
                            toolResult = `Sub-agent "${agentName}" responded: ${subAgentHistory[subAgentHistory.length - 1]?.content || ''}`;
                        } else if (subAgentConfig.type === 'external') {
                            const command = subAgentConfig.command.replace('{{prompt}}', taskPrompt);
                            const { stdout } = await $.quiet`${$.raw(command)}`;
                            toolResult = `Output from external agent "${agentName}":\n${stdout.toString()}`;
                        }
                    }
                } catch (e) {
                    // Not a delegation signal, continue
                }

                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: toolResult,
                });
            }
        } else {
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

    messages.push({ role: 'assistant', content: "Agent reached max turns." });
    return messages;
}