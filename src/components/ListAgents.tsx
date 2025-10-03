import React from 'react';
import { Box, Text } from 'ink';
import { type SubAgent, InternalAgent } from '../core/subagents.js';

const ListAgents = ({ agents }: { agents: SubAgent[] }) => {
  if (agents.length === 0) {
    return <Text>No custom agents found. Use 'xcode agent create' to build one.</Text>;
  }

  return (
    <Box flexDirection="column" paddingY={1}>
        <Text bold underline>Available Custom Agents:</Text>
        {agents.map((agent, index) => (
            <Box key={index} flexDirection="column" paddingY={1} borderStyle="round" borderColor="gray">
                <Box>
                    <Text bold color="cyan">Name: </Text>
                    <Text>{agent.name}</Text>
                </Box>
                 <Box>
                    <Text bold color="cyan">Type: </Text>
                    <Text>{agent.type}</Text>
                </Box>

                {agent.type === 'internal' ? (
                    <>
                        <Box>
                           <Text bold color="cyan">Persona: </Text>
                           <Text>{agent.persona}</Text>
                        </Box>
                        <Box>
                           <Text bold color="cyan">Tools: </Text>
                           <Text>{agent.tools.join(', ')}</Text>
                        </Box>
                    </>
                ) : (
                    <Box>
                        <Text bold color="cyan">Command: </Text>
                        <Text>{agent.command}</Text>
                    </Box>
                )}
            </Box>
        ))}
    </Box>
  );
};

export default ListAgents;