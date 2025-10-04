import OpenAI from 'openai';
import { type AiClient, type Message, type ToolCall, type AiResponse } from '../core/types.js';

// This function converts the application's internal message format to the format expected by the OpenAI API.
function toOpenAIMessage(msg: Message): OpenAI.Chat.ChatCompletionMessageParam {
    if (msg.role === 'tool') {
        return {
            role: 'tool',
            tool_call_id: msg.tool_call_id || '',
            content: msg.content as string,
        };
    }

    // Handle the case where the assistant is requesting a tool call.
    if (Array.isArray(msg.content)) {
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

// The NvidiaClient leverages the OpenAI client library but points it to the NVIDIA API endpoint.
export class NvidiaClient implements AiClient {
    private openai: OpenAI;
    private model: string;

    constructor(apiKey: string, model?: string) {
        this.openai = new OpenAI({
            apiKey,
            baseURL: 'https://integrate.api.nvidia.com/v1',
        });
        // Set a default model suitable for NVIDIA's catalog, but allow user override.
        this.model = model || 'nvidia/nemotron-4-340b-instruct';
    }

    async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
        const processedMessages = messages.map(toOpenAIMessage);

        const params: OpenAI.Chat.ChatCompletionCreateParams = {
            model: this.model,
            messages: processedMessages,
            stream: true, // Always enable streaming for real-time interaction.
        };

        if (tools.length > 0) {
            params.tools = tools.map(t => ({ type: 'function', function: t }));
            params.tool_choice = 'auto';
        }

        const stream = await this.openai.chat.completions.create(params);

        // The following logic handles the response stream, which can either be a tool call or a text response.
        const streamIterator = stream[Symbol.asyncIterator]();
        const firstChunkResult = await streamIterator.next();

        if (firstChunkResult.done) {
            return { isToolCall: false }; // Empty response.
        }

        const firstDelta = firstChunkResult.value.choices[0]?.delta;

        if (firstDelta?.tool_calls) {
            // It's a tool call. The stream needs to be consumed to assemble the full tool call data.
            const toolCallChunks: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[] = [...(firstDelta.tool_calls || [])];

            for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
                 const delta = chunk.choices[0]?.delta;
                 if (delta?.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                        const existing = toolCallChunks.find(c => c.index === toolCall.index);
                        if (existing) {
                            // Append arguments to the existing tool call chunk.
                            if (toolCall.function?.arguments) {
                                existing.function!.arguments += toolCall.function.arguments;
                            }
                        } else {
                             toolCallChunks.push(toolCall);
                        }
                    }
                 }
            }

            // Convert the assembled chunks into the application's internal ToolCall format.
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
            // It's a standard text response.
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