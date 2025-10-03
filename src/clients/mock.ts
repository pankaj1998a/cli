import { type AiClient, type AiResponse, type Message, type ToolCall } from '../core/types.js';

export class MockClient implements AiClient {
  async generateResponse(messages: Message[], tools: any[]): Promise<AiResponse> {
    const lastMessage = messages[messages.length - 1];

    // If the last message was a tool result, simulate generating a summary.
    if (lastMessage.role === 'tool') {
        const textStream = (async function* () {
            const text = `Okay, I have processed the tool's output. Here is the final answer based on that.`;
            for (const char of text) {
                yield char;
                await new Promise(resolve => setTimeout(resolve, 10)); // Simulate typing delay
            }
        })();
        return { isToolCall: false, textStream };
    }

    if (typeof lastMessage.content !== 'string') {
        return { isToolCall: false, textStream: (async function* () { yield "I can only process text messages."; })() };
    }

    const prompt = lastMessage.content.toLowerCase();

    // Simulate delegating a task
    if (prompt.includes('delegate')) {
        const toolCall: ToolCall = {
            id: 'call_delegate_789',
            type: 'function',
            function: {
                name: 'delegate_task',
                arguments: JSON.stringify({ "0": "test_agent", "1": "Please list the files in the current directory." }),
            },
        };
        return { isToolCall: true, toolCalls: [toolCall] };
    }

    // Simulate calling 'list_files'
    if (prompt.includes('list')) {
        const toolCall: ToolCall = {
            id: 'call_list_123',
            type: 'function',
            function: {
                name: 'list_files',
                arguments: JSON.stringify({ "0": "." }),
            },
        };
        return { isToolCall: true, toolCalls: [toolCall] };
    }

    // Simulate calling 'read_file'
    if (prompt.includes('read')) {
        const match = prompt.match(/read\s+(['"]?)(.*?)\1/);
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

    // Default text response (streamed)
    const textStream = (async function* () {
        const text = `Mock response for: "${lastMessage.content}"`;
        for (const char of text) {
            yield char;
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    })();
    return { isToolCall: false, textStream };
  }
}