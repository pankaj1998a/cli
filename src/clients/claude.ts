import Anthropic from '@anthropic-ai/sdk';
import { type AiClient, type Message, type ToolCall, type AiResponse } from '../core/types.js';

function toClaudeMessage(msg: Message): Anthropic.Messages.MessageParam {
    if (msg.role === 'tool') {
        return {
            role: 'user',
            content: [{
                type: 'tool_result',
                tool_use_id: msg.tool_call_id || '',
                content: msg.content as string,
            }],
        };
    }

    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        const toolUseContent: Anthropic.Messages.ToolUseBlock[] = msg.content.map(toolCall => ({
            type: 'tool_use',
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments),
        }));
        return { role: 'assistant', content: toolUseContent };
    }

    return {
        role: msg.role,
        content: msg.content as string,
    };
}

export class ClaudeClient implements AiClient {
    private anthropic: Anthropic;

    constructor(apiKey: string) {
        this.anthropic = new Anthropic({ apiKey });
    }

    async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
        const systemPrompt = "You are a helpful AI assistant."; // Claude API can use a system prompt
        const processedMessages = messages.map(toClaudeMessage);

        const params: Anthropic.Messages.MessageCreateParams = {
            model: 'claude-3-opus-20240229', // A capable default model
            max_tokens: 4096,
            system: systemPrompt,
            messages: processedMessages,
        };

        if (tools.length > 0) {
            params.tools = tools.map(t => ({
                name: t.name,
                description: t.description,
                input_schema: t.parameters,
            }));
        }

        const response = await this.anthropic.messages.create(params);

        if (response.stop_reason === 'tool_use') {
            const toolUseContent = response.content.filter(
                (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
            );

            const toolCalls: ToolCall[] = toolUseContent.map(tc => ({
                id: tc.id,
                type: 'function',
                function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.input),
                },
            }));
            return { isToolCall: true, toolCalls };
        } else {
            const textContent = response.content
                .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
                .map(block => block.text)
                .join(' ');
            return { isToolCall: false, text: textContent || undefined };
        }
    }
}