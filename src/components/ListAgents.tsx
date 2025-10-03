import React from 'react';
import { Box, Text } from 'ink';
import { type SubAgent } from '../core/subagents.js';

const ListAgents = ({ agents }: { agents: SubAgent[] }) => {
  if (agents.length === 0) {
    return <Text>No custom agents found. Use 'xcode agent create' to build one.</Text>;
  }

  return (
    <Box flexDirection="column" paddingY={1}>
        <Text bold underline>Available Custom Agents:</Text>
        {agents.map((agent, index) => (
            <Box key={index} flexDirection="column" paddingY={1} borderStyle="round" borderColor="gray">
                <Text bold color="cyan">Name:</Text>
                <Text>{agent.name}</Text>
                <Text bold color="cyan" marginTop={1}>Persona:</Text>
                <Text>{agent.persona}</Text>
                 <Text bold color="cyan" marginTop={1}>Tools:</Text>
                <Text>{agent.tools.join(', ')}</Text>
            </Box>
        ))}
    </Box>
  );
};

export default ListAgents;