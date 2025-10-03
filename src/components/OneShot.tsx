import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { type AiClient } from '../clients/index.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const OneShot = ({ client, prompt }: { client: AiClient, prompt: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const getResponse = async () => {
      setMessages([
        { role: 'user', content: prompt },
        { role: 'assistant', content: '...' },
      ]);
      try {
        const response = await client.getCompletion(prompt);
        setMessages([
            { role: 'user', content: prompt },
            { role: 'assistant', content: response },
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setMessages([
            { role: 'user', content: prompt },
            { role: 'assistant', content: `Error: ${errorMessage}` },
        ]);
      }
    };
    getResponse();
  }, [prompt, client]);

  return (
    <Box flexDirection="column" padding={1}>
      {messages.map((msg, index) => (
        <Box key={index} flexDirection="column" marginBottom={1}>
          <Text bold color={msg.role === 'user' ? 'cyan' : 'green'}>
            {msg.role === 'user' ? 'You' : 'AI'}:
          </Text>
          <Text>{msg.content}</Text>
        </Box>
      ))}
    </Box>
  );
};

export default OneShot;