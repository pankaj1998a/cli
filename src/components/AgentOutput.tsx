import React from 'react';
import { Box, Text } from 'ink';
import { type Message, type ToolCall } from '../core/types.js';

// Renders the content of an assistant's message, which could be text or a tool call request.
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

// This component now receives a complete, static list of messages and renders them.
const AgentOutput = ({ messages }: { messages: Message[] }) => {
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