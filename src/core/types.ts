export interface Message {
    role: 'user' | 'assistant' | 'tool' | 'system';
    content: string | ToolCall[] | AsyncIterable<string>;
    tool_call_id?: string;
    id?: number;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON string of arguments
    };
}

export interface AiResponse {
    isToolCall: boolean;
    toolCalls?: ToolCall[];
    // Text is now a stream of chunks
    textStream?: AsyncIterable<string>;
}

export interface AiClient {
  generateResponse(messages: Message[], tools: any[]): Promise<AiResponse>;
}