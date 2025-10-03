import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { type AiClient, type Message, type ToolCall } from '../core/types.js';
import { loadHistory, saveHistory, clearHistory } from '../core/history.js';
import { initializeToolRunner, ToolRunner } from '../core/agent.js';
import { type SubAgent, loadAgents } from '../core/subagents.js';

const Chat = ({ client, initialPrompt }: { client: AiClient, initialPrompt:string }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const messageIdCounter = useRef(0);
  const toolRunner = useRef<ToolRunner>(initializeToolRunner(client));
  const isInitialLoad = useRef(true);

  useInput((input, key) => {
    if (key.escape) {
      exit();
    }
  });

  const addMessage = (role: Message['role'], content: Message['content']): number => {
    const id = messageIdCounter.current++;
    setMessages(prev => [...prev, { id, role, content }]);
    return id;
  };

  const updateMessageContent = (id: number, chunk: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, content: (msg.content as string) + chunk } : msg
      )
    );
  };

  const processConversation = useCallback(async (prompt: string, history: Message[]) => {
    let currentHistory = [...history, { role: 'user', content: prompt } as Message];
    addMessage('user', prompt);

    for (let turn = 0; turn < 5; turn++) {
        const toolSchemas = toolRunner.current.getToolSchemas();
        const response = await client.generateResponse(currentHistory, toolSchemas);

        if (response.isToolCall && response.toolCalls) {
            const toolCalls = response.toolCalls;
            currentHistory.push({ role: 'assistant', content: toolCalls });
            addMessage('assistant', toolCalls);

            for (const toolCall of toolCalls) {
                const toolResult = await toolRunner.current.run(
                    toolCall.function.name,
                    Object.values(JSON.parse(toolCall.function.arguments))
                );
                currentHistory.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResult });
                addMessage('tool', toolResult);
            }
        } else if (response.textStream) {
            const assistantId = addMessage('assistant', '');
            for await (const chunk of response.textStream) {
                updateMessageContent(assistantId, chunk);
            }
            return;
        } else {
             addMessage('assistant', '[No response from AI]');
             return;
        }
    }
    addMessage('assistant', '[Agent reached max turns]');

  }, [client]);

  useEffect(() => {
    const init = async () => {
      const [history, agents] = await Promise.all([loadHistory(), loadAgents()]);
      setSubAgents(agents);

      if (history.length > 0) {
        setMessages(history.map((m, i) => ({ ...m, id: i })));
        messageIdCounter.current = history.length;
      } else if (initialPrompt) {
        await processConversation(initialPrompt, []);
      }
      isInitialLoad.current = false;
    };
    init();
  }, [initialPrompt, processConversation]);

  useEffect(() => {
    if (isInitialLoad.current || messages.length === 0) return;
    saveHistory(messages);
  }, [messages]);

  const handleSubmit = () => {
    if (input.startsWith('/')) {
        const [command] = input.split(' ');
        switch (command) {
            case '/clear':
                setMessages([]);
                clearHistory();
                addMessage('system', 'Conversation history cleared.');
                break;
            case '/agents':
                const agentList = subAgents.length > 0
                    ? `Available sub-agents: ${subAgents.map(a => a.name).join(', ')}`
                    : 'No custom sub-agents found. Use `xcode agent create` to add one.';
                addMessage('system', agentList);
                break;
            case '/help':
                addMessage('system', 'Available commands:\n/clear - Clears the conversation history.\n/agents - Lists available sub-agents.\n/help - Shows this help message.\n\nShortcuts:\nEsc - Exit the application.\n@<agent_name> <prompt> - Delegate a task to a sub-agent.\n#<tag> - Search conversation history (coming soon).');
                break;
            default:
                addMessage('system', `Unknown command: ${command}. Type /help for a list of commands.`);
                break;
        }
    } else if (input.startsWith('@')) {
        const [mention, ...promptParts] = input.split(' ');
        const agentName = mention.substring(1);
        const taskPrompt = promptParts.join(' ');
        const agentExists = subAgents.some(a => a.name === agentName);

        if (agentExists && taskPrompt) {
            const delegationPrompt = `delegate_task('${agentName}', '${taskPrompt}')`;
            const historyForApi = messages.map(({ role, content, tool_call_id }) => ({ role, content, tool_call_id }));
            processConversation(delegationPrompt, historyForApi);
        } else if (!agentExists) {
            addMessage('system', `Sub-agent "@${agentName}" not found. Type /agents to see the list of available agents.`);
        } else {
             addMessage('system', `You must provide a prompt after the @mention.`);
        }
    } else if (input.startsWith('#')) {
        addMessage('system', 'Search functionality with #tags is coming soon!');
    }
    else {
        const historyForApi = messages.map(({ role, content, tool_call_id }) => ({ role, content, tool_call_id }));
        processConversation(input, historyForApi);
    }
    setInput('');
  };

  const renderContent = (content: string | ToolCall[]) => {
      if (typeof content === 'string') {
          return <Text>{content}</Text>;
      }
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

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
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
                case 'system':
                     return (
                        <Box key={key} flexDirection="column" marginY={1} paddingX={1} borderColor="blue">
                            <Text color="blue">{msg.content as string}</Text>
                        </Box>
                    );
                default:
                    return null;
            }
        })}
      </Box>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder="Type message, or use /help, @<agent>, #<tag>"
      />
      <Box marginTop={1} paddingX={1} borderStyle="single" borderColor="gray">
        <Text dimColor>Press Esc to exit | Type /help for commands</Text>
      </Box>
    </Box>
  );
};

export default Chat;