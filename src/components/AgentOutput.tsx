import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SyntaxHighlight from 'ink-syntax-highlight';
import { type Message, type ToolCall } from '../core/types.js';
import { isAsyncIterable } from 'util/types';

// This function parses the assistant's content and renders code blocks with syntax highlighting.
const renderAssistantContent = (content: string) => {
    const parts = content.split(/(\`\`\`(?:\w+)?\n[\s\S]*?\n\`\`\`)/);

    return parts.map((part, index) => {
        const codeBlockMatch = part.match(/\`\`\`(\w+)?\n([\s\S]*?)\n\`\`\`/);
        if (codeBlockMatch) {
            const language = codeBlockMatch[1] || 'bash';
            const code = codeBlockMatch[2];
            return <SyntaxHighlight key={index} code={code} language={language} />;
        }
        // Render plain text parts
        return <Text key={index}>{part}</Text>;
    });
};


// Renders the content of an assistant's message, which could be text or a tool call request.
const renderContent = (content: string | ToolCall[] | AsyncIterable<string>) => {
    if (typeof content === 'string') {
        return <Box flexDirection="column">{renderAssistantContent(content)}</Box>;
    }

    // It's a tool call request from the assistant
    if (Array.isArray(content)) {
        return (
            <Box flexDirection="column" borderStyle="round" paddingX={1} borderColor="gray">
                <Text bold>Requesting Tool Call:</Text>
                {content.map((toolCall, index) => (
                    <Box key={index} flexDirection="column" marginTop={index > 0 ? 1 : 0}>
                        <Text>Tool: {toolCall.function.name}</Text>
                        <Text>Arguments: {toolCall.function.arguments}</Text>
                    </Box>
                ))}
            </Box>
        );
    }

    return <Text>[Streaming content...]</Text>;
};

// This component now receives a stream of messages and renders them as they arrive.
const AgentOutput = ({ messageStream }: { messageStream: AsyncGenerator<Message> }) => {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const processStream = async () => {
            for await (const message of messageStream) {
                if (isAsyncIterable(message.content)) {
                    const stream = message.content;
                    const assistantMessage: Message = { role: 'assistant', content: '' };
                    setMessages(prev => [...prev, assistantMessage]);

                    for await (const chunk of stream) {
                        setMessages(prev =>
                            prev.map((msg, index) =>
                                index === prev.length - 1
                                    ? { ...msg, content: (msg.content as string) + chunk }
                                    : msg
                            )
                        );
                    }
                } else {
                    setMessages(prev => [...prev, message]);
                }
            }
        };

        processStream();
    }, [messageStream]);

    return (
        <Box flexDirection="column" paddingY={1}>
            {messages.map((msg, index) => {
                const key = msg.id ?? index;
                switch (msg.role) {
                    case 'user':
                        return (
                            <Box key={key} flexDirection="column" marginBottom={1}>
                                <Text bold color="cyan">You:</Text>
                                <Text>{msg.content as string}</Text>
                            </Box>
                        );
                    case 'system':
                         return (
                            <Box key={key} flexDirection="column" marginBottom={1} paddingX={1} borderStyle="round" borderColor="gray">
                                <Text italic color="gray">{msg.content as string}</Text>
                            </Box>
                        );
                    case 'assistant':
                        return (
                            <Box key={key} flexDirection="column" marginBottom={1}>
                                <Text bold color="green">AI:</Text>
                                {renderContent(msg.content)}
                            </Box>
                        );
                    case 'tool':
                        return (
                            <Box key={key} flexDirection="column" marginY={1} borderStyle="single" paddingX={1} borderColor="yellow">
                                <Text bold color="yellow">Tool Output:</Text>
                                <Text>{msg.content as string}</Text>
                            </Box>
                        );
                    default:
                        return null;
                }
            })}
        </Box>
    );
};

export default AgentOutput;