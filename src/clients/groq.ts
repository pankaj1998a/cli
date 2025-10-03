import OpenAI from 'openai';
import { type AiClient, type Message, type ToolCall, type AiResponse } from '../core/types.js';

// Groq uses an OpenAI-compatible API, so we can reuse the same message transformation logic.
function toOpenAIMessage(msg: Message): OpenAI.Chat.ChatCompletionMessageParam {
    if (msg.role === 'tool') {
        return {
            role: 'tool',
            tool_call_id: msg.tool_call_id || '',
            content: msg.content as string,
        };
    }

    if (Array.isArray(msg.content)) { // Assistant requesting tool call
        const toolCalls: OpenAI.Chat.ChatCompletionAssistantMessageParam.ToolCall[] = msg.content.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
            },
        }));
        return { role: 'assistant', tool_calls: toolCalls };
    }

    return {
        role: msg.role,
        content: msg.content as string,
    };
}

export class GroqClient implements AiClient {
    private groq: OpenAI;
    private model: string;

    constructor(apiKey: string, model?: string) {
        this.groq = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        });
        this.model = model || 'llama3-8b-8192';
    }

    async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
        const processedMessages = messages.map(toOpenAIMessage);

        const params: OpenAI.Chat.ChatCompletionCreateParams = {
            model: this.model,
            messages: processedMessages,
            stream: true,
        };

        if (tools.length > 0) {
            params.tools = tools.map(t => ({ type: 'function', function: t }));
            params.tool_choice = 'auto';
        }

        const stream = await this.groq.chat.completions.create(params);

        const streamIterator = stream[Symbol.asyncIterator]();
        const firstChunkResult = await streamIterator.next();

        if (firstChunkResult.done) {
            return { isToolCall: false };
        }

        const firstDelta = firstChunkResult.value.choices[0]?.delta;

        if (firstDelta?.tool_calls) {
            const toolCallChunks: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[] = [...(firstDelta.tool_calls || [])];

            for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
                 const delta = chunk.choices[0]?.delta;
                 if (delta?.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                        const existing = toolCallChunks.find(c => c.index === toolCall.index);
                        if (existing) {
                            if (toolCall.function?.arguments) {
                                existing.function!.arguments += toolCall.function.arguments;
                            }
                        } else {
                             toolCallChunks.push(toolCall);
                        }
                    }
                 }
            }

            const finalToolCalls: ToolCall[] = toolCallChunks.map(tc => ({
                id: tc.id!,
                type: 'function',
                function: {
                    name: tc.function!.name!,
                    arguments: tc.function!.arguments!,
                }
            }));
            return { isToolCall: true, toolCalls: finalToolCalls };
        } else {
            const textStream = (async function* () {
                if (firstDelta?.content) {
                    yield firstDelta.content;
                }
                for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        yield content;
                    }
                }
            })();
            return { isToolCall: false, textStream };
        }
    }
}