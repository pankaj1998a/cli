import { type Message } from './types.js';
import { initializeToolRunner } from './agent.js';
import { type SubAgent } from './subagents.js';
import { type Config } from './config.js';
import { getClient } from '../clients/index.js';
import path from 'path';
import fs from 'fs/promises';

// Searches for AGENTS.md in the current directory and parent directories.
export async function findAndReadAgentsMd(): Promise<string | null> {
    let currentDir = process.cwd();
    const { root } = path.parse(currentDir);

    while (currentDir !== root) {
        const filePath = path.join(currentDir, 'AGENTS.md');
        try {
            await fs.access(filePath);
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            // File doesn't exist, continue to parent.
        }
        currentDir = path.dirname(currentDir);
    }

    // Check root directory
    try {
        const filePath = path.join(root, 'AGENTS.md');
        await fs.access(filePath);
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        return null;
    }
}

export async function* processAgentTurns(
    config: Config,
    flags: { provider?: string, model?: string },
    conversation: Message[],
    agentConfig?: SubAgent,
): AsyncGenerator<Message> {
    const provider = agentConfig?.provider || flags.provider || 'mock';
    const model = agentConfig?.model || flags.model;
    const client = getClient(provider, config, { model });

    const toolRunner = initializeToolRunner(config, flags, agentConfig?.tools);

    let messages = [...conversation];

    // Inject persona if it's the first turn for this agent.
    const isFirstTurn = !messages.some(m => m.role === 'assistant' || m.role === 'tool');
    if (isFirstTurn && agentConfig?.persona) {
        const personaMsg = { role: 'system' as const, content: agentConfig.persona };
        messages.unshift(personaMsg);
        yield personaMsg;
    }

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
            if (response.textStream) {
                yield { role: 'assistant', content: response.textStream };
            } else {
                yield { role: 'assistant', content: "[No response from AI]" };
            }
            return;
        }
    }

    yield { role: 'assistant', content: "The agent reached the maximum number of turns without providing a final answer." };
}