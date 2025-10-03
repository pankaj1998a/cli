import { ToolRunner } from '../tools/index.js';
import { listFilesTool } from '../tools/listFiles.js';
import { readFileTool } from '../tools/readFile.js';
import { createFileTool } from '../tools/createFile.js';
import { deleteFileTool } from '../tools/deleteFile.js';
import { executeCommandTool } from '../tools/executeCommand.js';
import { type AiClient, type Message } from '../core/types.js';

export function initializeToolRunner(): ToolRunner {
    const toolRunner = new ToolRunner();
    toolRunner.register(listFilesTool);
    toolRunner.register(readFileTool);
    toolRunner.register(createFileTool);
    toolRunner.register(deleteFileTool);
    toolRunner.register(executeCommandTool);
    return toolRunner;
}

export async function runAgent(client: AiClient, prompt: string): Promise<Message[]> {
    const toolRunner = initializeToolRunner();
    const messages: Message[] = [{ role: 'user', content: prompt }];
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
            if (response.text) {
                messages.push({ role: 'assistant', content: response.text });
            }
            return messages; // Return the full conversation history
        }
    }

    messages.push({ role: 'assistant', content: "The agent reached the maximum number of turns without providing a final answer." });
    return messages;
}