import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { type AiClient, type Message, type ToolCall } from '../core/types.js';
import { loadHistory, saveHistory } from '../core/history.js';

const Chat = ({ client, initialPrompt, isAgentMode }: { client: AiClient, initialPrompt:string, isAgentMode: boolean }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messageIdCounter = useRef(0);
  const isInitialLoad = useRef(true);

  const processMessage = async (prompt: string, currentMessages: Message[]) => {
    if (!prompt) return;

    const newUserMessage: Message = { id: messageIdCounter.current++, role: 'user', content: prompt };
    const thinkingMessage: Message = { id: messageIdCounter.current++, role: 'assistant', content: '...' };

    setMessages([...currentMessages, newUserMessage, thinkingMessage]);

    const historyForApi = [...currentMessages, newUserMessage].map(({ role, content }) => ({ role, content }));

    try {
        const response = await client.generateResponse(historyForApi, []);

        setMessages(prev => prev.map(msg => (msg.id === thinkingMessage.id ? { ...msg, content: response.text || '' } : msg)));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setMessages(prev => prev.map(msg => (msg.id === thinkingMessage.id ? { ...msg, content: `Error: ${errorMessage}` } : msg)));
    }
  };

  useEffect(() => {
    const init = async () => {
      const history = await loadHistory();
      if (history.length > 0) {
        const historyWithIds = history.map((m, i) => ({ ...m, id: i }));
        setMessages(historyWithIds);
        messageIdCounter.current = history.length;
      } else if (initialPrompt) {
        await processMessage(initialPrompt, []);
      }
      isInitialLoad.current = false;
    };
    init();
  }, [initialPrompt]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    saveHistory(messages);
  }, [messages]);

  const handleSubmit = () => {
    processMessage(input, messages);
    setInput('');
  };

  const renderContent = (content: string | ToolCall[]) => {
      if (typeof content === 'string') {
          return <Text>{content}</Text>;
      }
      return <Text color="red">[Unsupported agent response in chat mode]</Text>;
  }

  return (
    <Box flexDirection="column" padding={1}>
        {isAgentMode && <Text bold color="magenta">--- Agent Mode ---</Text>}
      <Box flexDirection="column" flexGrow={1}>
        {messages.map(msg => (
          <Box key={msg.id} flexDirection="column" marginBottom={1}>
            <Text bold color={msg.role === 'user' ? 'cyan' : 'green'}>
              {msg.role === 'user' ? 'You' : 'AI'}:
            </Text>
            {renderContent(msg.content)}
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