import { type AiClient, type AiResponse, type Message, type ToolCall } from '../core/types.js';

export class MockClient implements AiClient {
  async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
    const lastMessage = messages[messages.length - 1];

    // If the last message was a tool result, simulate generating a summary.
    if (lastMessage.role === 'tool') {
        return { isToolCall: false, text: `Okay, I have processed the tool's output. Here is the final answer based on that.` };
    }

    if (typeof lastMessage.content !== 'string') {
        return { isToolCall: false, text: "I can only process text messages." };
    }

    const prompt = lastMessage.content.toLowerCase();

    // Simulate calling 'list_files'
    if (prompt.includes('list')) {
        const toolCall: ToolCall = {
            id: 'call_list_123',
            type: 'function',
            function: {
                name: 'list_files',
                arguments: JSON.stringify({ "0": "." }), // Mock: list current directory
            },
        };
        return { isToolCall: true, toolCalls: [toolCall] };
    }

    // Simulate calling 'read_file'
    if (prompt.includes('read')) {
        const match = prompt.match(/read\s+(['"]?)(.*?)\1/); // simple regex to find filename
        const filename = match ? match[2] : 'example.txt';
         const toolCall: ToolCall = {
            id: 'call_read_456',
            type: 'function',
            function: {
                name: 'read_file',
                arguments: JSON.stringify({ "0": filename }),
            },
        };
        return { isToolCall: true, toolCalls: [toolCall] };
    }

    // Default text response
    return { isToolCall: false, text: `Mock response for: "${lastMessage.content}"` };
  }
}