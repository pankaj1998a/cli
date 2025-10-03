import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { type AiClient } from '../clients/index.js';
import { loadHistory, saveHistory, type Message } from '../core/history.js';

const Chat = ({ client, initialPrompt }: { client: AiClient, initialPrompt:string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messageIdCounter = useRef(0);
  const isInitialLoad = useRef(true);

  const sendMessage = useCallback(async (prompt: string) => {
    if (!prompt) return;

    const userId = messageIdCounter.current++;
    const assistantId = messageIdCounter.current++;

    const userMessage: Message = { id: userId, role: 'user', content: prompt };
    const thinkingMessage: Message = { id: assistantId, role: 'assistant', content: '...' };

    setMessages(prev => [...prev, userMessage, thinkingMessage]);

    try {
        const response = await client.getCompletion(prompt);
        setMessages(prev =>
            prev.map(msg => (msg.id === assistantId ? { ...msg, content: response } : msg))
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setMessages(prev =>
            prev.map(msg => (msg.id === assistantId ? { ...msg, content: `Error: ${errorMessage}` } : msg))
        );
    }
  }, [client]);

  useEffect(() => {
    const init = async () => {
      const history = await loadHistory();
      if (history.length > 0) {
        setMessages(history);
        messageIdCounter.current = Math.max(...history.map(m => m.id)) + 1;
      } else if (initialPrompt) {
        await sendMessage(initialPrompt);
      }
    };
    init().then(() => {
        isInitialLoad.current = false;
    });
  }, [initialPrompt, sendMessage]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    saveHistory(messages);
  }, [messages]);

  const handleSubmit = () => {
    sendMessage(input);
    setInput('');
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        {messages.map(msg => (
          <Box key={msg.id} flexDirection="column" marginBottom={1}>
            <Text bold color={msg.role === 'user' ? 'cyan' : 'green'}>
              {msg.role === 'user' ? 'You' : 'AI'}:
            </Text>
            <Text>{msg.content}</Text>
          </Box>
        ))}
      </Box>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder="Type your message..."
      />
    </Box>
  );
};

export default Chat;