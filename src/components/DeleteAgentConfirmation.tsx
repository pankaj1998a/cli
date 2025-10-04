import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import ConfirmInput from 'ink-confirm-input';
import { loadAgents, saveAgents } from '../core/subagents.js';

const DeleteAgentConfirmation = ({ agentName }: { agentName: string }) => {
    const { exit } = useApp();
    const [status, setStatus] = useState<'loading' | 'notFound' | 'confirming' | 'deleted' | 'cancelled'>('loading');

    useEffect(() => {
        const findAgent = async () => {
            const agents = await loadAgents();
            const agentExists = agents.some(agent => agent.name === agentName);
            if (agentExists) {
                setStatus('confirming');
            } else {
                setStatus('notFound');
            }
        };
        findAgent();
    }, [agentName]);

    const handleConfirm = async (confirmed: boolean) => {
        if (confirmed) {
            const agents = await loadAgents();
            const updatedAgents = agents.filter(agent => agent.name !== agentName);
            await saveAgents(updatedAgents);
            setStatus('deleted');
        } else {
            setStatus('cancelled');
        }
    };

    useEffect(() => {
        // Automatically exit after showing the final status message.
        if (status === 'deleted' || status === 'cancelled' || status === 'notFound') {
            setTimeout(exit, 1000);
        }
    }, [status, exit]);

    switch (status) {
        case 'loading':
            return <Text>Searching for agent "{agentName}"...</Text>;
        case 'notFound':
            return <Text color="red">Agent "{agentName}" not found.</Text>;
        case 'confirming':
            return (
                <Box>
                    <Text>Are you sure you want to delete the agent "{agentName}"? (y/n) </Text>
                    <ConfirmInput onConfirm={handleConfirm} />
                </Box>
            );
        case 'deleted':
            return <Text color="green">Agent "{agentName}" has been deleted.</Text>;
        case 'cancelled':
            return <Text color="yellow">Deletion cancelled.</Text>;
        default:
            return null;
    }
};

export default DeleteAgentConfirmation;