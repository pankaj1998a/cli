import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SyntaxHighlight from 'ink-syntax-highlight';

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

const OneShot = ({ prompt, responseStream }: { prompt: string, responseStream?: AsyncIterable<string> }) => {
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (!responseStream) return;

    const streamResponse = async () => {
        for await (const chunk of responseStream) {
            setResponseText(prev => prev + chunk);
        }
    };

    streamResponse();
  }, [responseStream]);

  return (
    <Box flexDirection="column" padding={1}>
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="cyan">You:</Text>
          <Text>{prompt}</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold color="green">AI:</Text>
          {renderAssistantContent(responseText)}
        </Box>
    </Box>
  );
};

export default OneShot;