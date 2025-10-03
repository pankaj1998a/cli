export interface Message {
    role: 'user' | 'assistant' | 'tool';
    content: string | ToolCall[];
    tool_call_id?: string;
    // Add the optional 'id' for the Chat component's key prop,
    // but it won't be part of the core AI interaction protocol.
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
    text?: string;
}

export interface AiClient {
  generateResponse(messages: Message[], tools: any[]): Promise<AiResponse>;
}