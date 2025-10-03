import { GoogleGenerativeAI, type Content, type Part, FunctionDeclarationSchemaType } from '@google/generative-ai';
import { type AiClient, type Message, type ToolCall, type AiResponse } from '../core/types.js';

function toGeminiMessage(msg: Message): Content {
    if (msg.role === 'tool') {
        return {
            role: 'tool',
            parts: [{
                functionResponse: {
                    name: msg.tool_call_id || '', // This needs to map to the function name that was called
                    response: {
                        name: msg.tool_call_id || '',
                        content: msg.content as string,
                    }
                }
            }]
        };
    }

    if (Array.isArray(msg.content)) { // Assistant requesting tool call
        const parts: Part[] = msg.content.map(toolCall => ({
            functionCall: {
                name: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments),
            }
        }));
        return { role: 'model', parts };
    }

    return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content as string }],
    };
}


export class GeminiClient implements AiClient {
    private model: any;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
        const history = messages.map(toGeminiMessage);
        const lastMessage = history.pop(); // The last message is the new prompt

        const chat = this.model.startChat({
            history,
            tools: [{ functionDeclarations: tools }],
        });

        const result = await chat.sendMessage(lastMessage.parts);
        const response = result.response;
        const responseParts = response.candidates[0].content.parts;

        const toolCalls: ToolCall[] = [];
        for (const part of responseParts) {
            if (part.functionCall) {
                const toolCall: ToolCall = {
                    id: part.functionCall.name, // Using name as ID for simplicity
                    type: 'function',
                    function: {
                        name: part.functionCall.name,
                        arguments: JSON.stringify(part.functionCall.args),
                    },
                };
                toolCalls.push(toolCall);
            }
        }

        if (toolCalls.length > 0) {
            return { isToolCall: true, toolCalls };
        } else {
            return { isToolCall: false, text: response.text() };
        }
    }
}