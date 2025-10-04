import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import MultiSelect from './MultiSelect.js';
import { type SubAgent, loadAgents, saveAgents } from '../core/subagents.js';
import { allToolNames } from '../core/agent.js';

type Step = 'name' | 'persona' | 'provider' | 'model' | 'tools' | 'done';
interface AgentFormProps {
    agentToEdit?: SubAgent;
}

const AgentForm = ({ agentToEdit }: AgentFormProps) => {
    const { exit } = useApp();
    const [mode] = useState<'create' | 'edit'>(agentToEdit ? 'edit' : 'create');
    const [step, setStep] = useState<Step>(mode === 'create' ? 'name' : 'persona');
    const [existingAgents, setExistingAgents] = useState<SubAgent[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [agentData, setAgentData] = useState<Partial<SubAgent>>(
        agentToEdit || {
            name: '',
            persona: '',
            provider: '',
            model: '',
            tools: [],
        }
    );

    useEffect(() => {
        loadAgents().then(setExistingAgents);
    }, []);

    const handleNameSubmit = (name: string) => {
        if (!name) {
            setError('Agent name cannot be empty.');
            return;
        }
        if (existingAgents.some(agent => agent.name === name)) {
            setError(`An agent with the name "${name}" already exists.`);
            return;
        }
        setAgentData(prev => ({ ...prev, name }));
        setError(null);
        setStep('persona');
    };

    const handlePersonaSubmit = (persona: string) => {
        setAgentData(prev => ({ ...prev, persona }));
        setStep('provider');
    };

    const handleProviderSubmit = (provider: string) => {
        setAgentData(prev => ({ ...prev, provider }));
        setStep('model');
    };

    const handleModelSubmit = (model: string) => {
        setAgentData(prev => ({ ...prev, model }));
        setStep('tools');
    };

    const handleToolsSubmit = (items: any) => {
        const selectedTools = items.filter((item:any) => item.isSelected).map((item:any) => item.value);
        const finalAgent = { ...agentData, tools: selectedTools } as SubAgent;

        let updatedAgents: SubAgent[];
        if (mode === 'edit') {
            updatedAgents = existingAgents.map(agent =>
                agent.name === finalAgent.name ? finalAgent : agent
            );
        } else {
            updatedAgents = [...existingAgents, finalAgent];
        }

        saveAgents(updatedAgents).then(() => {
            setStep('done');
        });
    };

    useEffect(() => {
        if (step === 'done') {
            setTimeout(exit, 1000);
        }
    }, [step, exit]);

    const renderStep = () => {
        switch (step) {
            case 'name': // Only runs in 'create' mode
                return (
                    <>
                        <Text>Enter a unique name for the new agent:</Text>
                        <TextInput value={agentData.name || ''} onChange={(val) => setAgentData(p => ({...p, name: val}))} onSubmit={handleNameSubmit} />
                    </>
                );
            case 'persona':
                return (
                    <>
                        <Text>Describe the agent's persona:</Text>
                        <TextInput value={agentData.persona || ''} onChange={(val) => setAgentData(p => ({...p, persona: val}))} onSubmit={handlePersonaSubmit} />
                    </>
                );
            case 'provider':
                return (
                    <>
                        <Text>Enter the AI provider (e.g., openai). Leave blank for default:</Text>
                        <TextInput value={agentData.provider || ''} onChange={(val) => setAgentData(p => ({...p, provider: val}))} onSubmit={handleProviderSubmit} />
                    </>
                );
            case 'model':
                return (
                    <>
                        <Text>Enter a specific model. Leave blank for default:</Text>
                        <TextInput value={agentData.model || ''} onChange={(val) => setAgentData(p => ({...p, model: val}))} onSubmit={handleModelSubmit} />
                    </>
                );
            case 'tools':
                const toolItems = allToolNames.map(name => ({
                    label: name,
                    value: name,
                    isSelected: agentData.tools?.includes(name) || false,
                }));
                return (
                    <>
                        <Text>Select the tools this agent can use (Space to select, Enter to confirm):</Text>
                        <MultiSelect items={toolItems} onSelect={handleToolsSubmit} />
                    </>
                );
            case 'done':
                const action = mode === 'edit' ? 'updated' : 'created';
                return <Text color="green">Agent "{agentData.name}" {action} successfully!</Text>;
        }
    };

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold>{mode === 'edit' ? `Editing Agent: ${agentToEdit?.name}` : 'Create New Sub-Agent'}</Text>
            <Box flexDirection="column" marginTop={1}>
                {renderStep()}
                {error && <Text color="red">{error}</Text>}
            </Box>
        </Box>
    );
};

export default AgentForm;