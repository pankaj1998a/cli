import { type Tool, ToolRunner } from '../tools/index.js';
import { listFilesTool } from '../tools/listFiles.js';
import { readFileTool } from '../tools/readFile.js';
import { createFileTool } from '../tools/createFile.js';
import { deleteFileTool } from '../tools/deleteFile.js';
import { executeCommandTool } from '../tools/executeCommand.js';
import { createDelegateTaskTool } from '../tools/delegateTask.js';
import { searchWebTool } from '../tools/searchWeb.js';
import { type Config } from './config.js';

// A map of all available tool definitions.
const toolImplementations: { [name: string]: Tool | ((config: Config, flags: any) => Tool) } = {
    search_web: searchWebTool,
    list_files: listFilesTool,
    read_file: readFileTool,
    create_file: createFileTool,
    delete_file: deleteFileTool,
    execute_command: executeCommandTool,
    delegate_task: createDelegateTaskTool,
};

// Export the list of tool names for use in other parts of the application, like the agent creation form.
export const allToolNames = Object.keys(toolImplementations);

export function initializeToolRunner(
    config: Config,
    flags: { provider?: string, model?: string },
    allowedToolNames?: string[]
): ToolRunner {
    const toolRunner = new ToolRunner();

    // If no specific tools are allowed, it's the main agent; give it all tools.
    // Otherwise, use the provided list.
    const toolsToRegisterNames = allowedToolNames || allToolNames;

    for (const toolName of toolsToRegisterNames) {
        const toolImplementation = toolImplementations[toolName];
        if (toolImplementation) {
            // If the tool is a function (i.e., it requires config/flags), create it.
            // Otherwise, use the static tool object.
            const tool = typeof toolImplementation === 'function'
                ? toolImplementation(config, flags)
                : toolImplementation;
            toolRunner.register(tool);
        }
    }

    return toolRunner;
}