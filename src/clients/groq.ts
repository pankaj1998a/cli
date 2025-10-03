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

    constructor(apiKey: string) {
        // The Groq SDK is a wrapper around the OpenAI SDK,
        // so we instantiate it with the correct base URL.
        this.groq = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        });
    }

    async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
        const processedMessages = messages.map(toOpenAIMessage);

        const params: OpenAI.Chat.ChatCompletionCreateParams = {
            model: 'llama3-8b-8192', // A capable default model on Groq
            messages: processedMessages,
        };

        if (tools.length > 0) {
            params.tools = tools.map(t => ({ type: 'function', function: t }));
            params.tool_choice = 'auto';
        }

        const response = await this.groq.chat.completions.create(params);
        const choice = response.choices[0];

        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
            const toolCalls: ToolCall[] = choice.message.tool_calls.map(tc => ({
                id: tc.id,
                type: 'function',
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                },
            }));
            return { isToolCall: true, toolCalls };
        } else {
            return { isToolCall: false, text: choice.message.content || undefined };
        }
    }
}