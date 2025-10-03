import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

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
          <Text>{responseText}</Text>
        </Box>
    </Box>
  );
};

export default OneShot;