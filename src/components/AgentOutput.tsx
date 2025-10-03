import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { type Message, type ToolCall, type AiResponse } from '../core/types.js';

const renderContent = (content: string | ToolCall[]) => {
    if (typeof content === 'string') {
        return <Text>{content}</Text>;
    }

    // It's a tool call request from the assistant
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
};

const AgentOutput = ({ initialMessages, finalResponseStream }: { initialMessages: Message[], finalResponseStream: AiResponse }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    const streamResponse = async () => {
        if (finalResponseStream.isToolCall) {
            // This case should be handled by the agent loop, but as a fallback:
            setMessages(prev => [...prev, { role: 'assistant', content: '[Error: Expected a text stream, but got a tool call.]' }]);
            return;
        }

        if (finalResponseStream.textStream) {
            const assistantMessage: Message = { role: 'assistant', content: '' };
            setMessages(prev => [...prev, assistantMessage]);

            for await (const chunk of finalResponseStream.textStream) {
                setMessages(prev =>
                    prev.map((msg, index) =>
                        index === prev.length - 1
                        ? { ...msg, content: (msg.content as string) + chunk }
                        : msg
                    )
                );
            }
        }
    };

    streamResponse();
  }, [finalResponseStream]);

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