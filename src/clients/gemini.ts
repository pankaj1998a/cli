import { GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai';
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
    private genAI: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, model?: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = model || "gemini-1.5-flash";
    }

    async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
        const model = this.genAI.getGenerativeModel({
            model: this.modelName,
            tools: [{ functionDeclarations: tools }],
        });

        const history = messages.map(toGeminiMessage);
        const lastMessage = history.pop();

        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage!.parts);

        // Since Gemini SDK v0.11.0, we need to aggregate chunks for tool calls
        // or stream for text. We'll check the first chunk to decide.
        let aggregatedResponse = '';
        let toolCalls: ToolCall[] = [];

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            aggregatedResponse += chunkText;

            if (chunk.functionCalls()) {
                 toolCalls = chunk.functionCalls().map(fc => ({
                    id: fc.name,
                    type: 'function',
                    function: {
                        name: fc.name,
                        arguments: JSON.stringify(fc.args),
                    },
                }));
            }
        }

        if (toolCalls.length > 0) {
            return { isToolCall: true, toolCalls };
        } else {
            const textStream = (async function* () {
                yield aggregatedResponse;
            })();
            return { isToolCall: false, textStream };
        }
    }
}