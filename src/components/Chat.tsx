import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SyntaxHighlight from 'ink-syntax-highlight';
import { type Message, type ToolCall } from '../core/types.js';
import { loadHistory, saveHistory, clearHistory } from '../core/history.js';
import { type SubAgent, loadAgents } from '../core/subagents.js';
import { type Config, loadConfig } from '../core/config.js';
import { processAgentTurns } from '../core/agent_loop.js';
import MultiSelect from './MultiSelect.js';
import Confirm from './Confirm.js';

const renderAssistantContent = (content: string | ToolCall[] | AsyncIterable<string>) => {
    if (typeof content === 'string') {
        const parts = content.split(/(\`\`\`(?:\w+)?\n[\s\S]*?\n\`\`\`)/);
        return parts.map((part, index) => {
            const codeBlockMatch = part.match(/\`\`\`(\w+)?\n([\s\S]*?)\n\`\`\`/);
            if (codeBlockMatch) {
                const language = codeBlockMatch[1] || 'bash';
                const code = codeBlockMatch[2];
                return <SyntaxHighlight key={index} code={code} language={language} />;
            }
            return <Text key={index}>{part}</Text>;
        });
    }

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

const Chat = ({ initialPrompt }: { initialPrompt: string }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [appConfig, setAppConfig] = useState<Config>({});
  const [isRunning, setIsRunning] = useState(false);
  const isInitialLoad = useRef(true);

  useInput((_, key) => {
    if (key.escape) exit();
  });

  const runAgentConversation = useCallback(async (conversation: Message[]) => {
      setIsRunning(true);
      const messageStream = processAgentTurns(appConfig, {}, conversation);

      for await (const message of messageStream) {
          // Check for async iterable content using the language-native Symbol.asyncIterator.
          if (message.content && typeof message.content[Symbol.asyncIterator] === 'function') {
              const stream = message.content as AsyncIterable<string>;
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
      setIsRunning(false);
  }, [appConfig]);

  useEffect(() => {
    const init = async () => {
      const [history, config] = await Promise.all([loadHistory(), loadConfig()]);
      setAppConfig(config);
      setMessages(history);

      if (initialPrompt) {
        const fullConversation = [...history, { role: 'user' as const, content: initialPrompt }];
        setMessages(fullConversation);
        await runAgentConversation(fullConversation);
      }
      isInitialLoad.current = false;
    };
    init();
  }, [initialPrompt, runAgentConversation]);

  useEffect(() => {
    if (isInitialLoad.current || messages.length === 0) return;
    saveHistory(messages);
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isRunning) return;

    const userMessage: Message = { role: 'user', content: input };
    const newConversation = [...messages, userMessage];
    setMessages(newConversation);
    runAgentConversation(newConversation);
    setInput('');
  };

  return (
    <Box flexDirection="column" padding={1} height="100%">
      <Box flexDirection="column" flexGrow={1}>
        {messages.map((msg, index) => (
            <Box key={index} flexDirection="column" marginBottom={1}>
                {msg.role === 'user' && <Text bold color="cyan">You:</Text>}
                {msg.role === 'assistant' && <Text bold color="green">AI:</Text>}
                {msg.role === 'tool' && <Text bold color="yellow">Tool Output:</Text>}
                {msg.role === 'system' && <Text bold color="gray">System:</Text>}
                {renderAssistantContent(msg.content as any)}
            </Box>
        ))}
        {isRunning && <Text>...</Text>}
      </Box>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder={isRunning ? "Agent is running..." : "Type your message..."}
      />
    </Box>
  );
};

export default Chat;