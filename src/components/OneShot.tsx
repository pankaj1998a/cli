import React from 'react';
import { Box, Text } from 'ink';

const OneShot = ({ prompt, response }: { prompt: string, response: string }) => {
  return (
    <Box flexDirection="column" padding={1}>
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="cyan">You:</Text>
          <Text>{prompt}</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold color="green">AI:</Text>
          <Text>{response}</Text>
        </Box>
    </Box>
  );
};

export default OneShot;