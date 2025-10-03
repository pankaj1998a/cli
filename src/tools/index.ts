export interface Tool {
    name: string;
    description: string;
    execute(args: any[]): Promise<string>;
}

export class ToolRunner {
    private tools: Map<string, Tool> = new Map();

    register(tool: Tool): void {
        this.tools.set(tool.name, tool);
    }

    async run(toolName: string, args: any[]): Promise<string> {
        const tool = this.tools.get(toolName);
        if (!tool) {
            return `Error: Tool "${toolName}" not found.`;
        }
        try {
            return await tool.execute(args);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error executing tool "${toolName}": ${errorMessage}`;
        }
    }

    getToolSchemas(): any[] {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            // This can be expanded with more detailed argument schemas
            parameters: {
                type: 'object',
                properties: {},
            },
        }));
    }
}