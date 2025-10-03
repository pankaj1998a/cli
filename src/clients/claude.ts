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
    private model: string;

    constructor(apiKey: string, model?: string) {
        this.anthropic = new Anthropic({ apiKey });
        this.model = model || 'claude-3-haiku-20240307'; // Haiku is a fast, capable default
    }

    async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
        const systemPrompt = "You are a helpful AI assistant.";
        const processedMessages = messages.map(toClaudeMessage);

        const params: Anthropic.Messages.MessageCreateParams = {
            model: this.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: processedMessages,
            stream: true,
        };

        if (tools.length > 0) {
            params.tools = tools.map(t => ({
                name: t.name,
                description: t.description,
                input_schema: t.parameters,
            }));
        }

        const stream = await this.anthropic.messages.create(params);

        // Since we need to know if it's a tool call or text stream upfront,
        // we have to process the stream internally and then decide what to return.
        let isToolCall = false;
        const toolCallChunks: { [id: string]: { name: string, input: string } } = {};
        let textChunks: string[] = [];

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'tool_use') {
                isToolCall = true;
                const toolUse = event.delta.tool_use;
                if (!toolCallChunks[toolUse.id]) {
                    toolCallChunks[toolUse.id] = { name: toolUse.name, input: '' };
                }
                toolCallChunks[toolUse.id].input += toolUse.input_json_delta;
            } else if (event.type === 'message_delta') {
                if (event.delta.stop_reason === 'tool_use') {
                    isToolCall = true;
                }
            } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                textChunks.push(event.delta.text);
            }
        }

        if (isToolCall) {
            const finalToolCalls: ToolCall[] = Object.entries(toolCallChunks).map(([id, { name, input }]) => ({
                id,
                type: 'function',
                function: { name, arguments: input },
            }));
            return { isToolCall: true, toolCalls: finalToolCalls };
        } else {
            const textStream = (async function* () {
                for (const chunk of textChunks) {
                    yield chunk;
                }
            })();
            return { isToolCall: false, textStream };
        }
    }
}