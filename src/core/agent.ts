import { ToolRunner } from '../tools/index.js';
import { listFilesTool } from '../tools/listFiles.js';
import { readFileTool } from '../tools/readFile.js';
import { createFileTool } from '../tools/createFile.js';
import { deleteFileTool } from '../tools/deleteFile.js';
import { executeCommandTool } from '../tools/executeCommand.js';
import { createDelegateTaskTool } from '../tools/delegateTask.js';
import { searchWebTool } from '../tools/searchWeb.js';
import { type Config } from './config.js';

const allTools = [
    searchWebTool,
    listFilesTool,
    readFileTool,
    createFileTool,
    deleteFileTool,
    executeCommandTool,
];

export function initializeToolRunner(
    config: Config,
    flags: { provider?: string, model?: string },
    allowedToolNames?: string[]
): ToolRunner {
    const toolRunner = new ToolRunner();

    // Use a copy to avoid modifying the global `allTools` array
    let toolsToRegister = [...allTools];

    // If a list of allowed tools is provided (i.e., for a sub-agent), filter the list.
    if (allowedToolNames) {
        toolsToRegister = allTools.filter(tool => allowedToolNames.includes(tool.name));
    } else {
        // If no specific tools are allowed, it's the main agent, which can delegate.
        // Add the delegation tool, passing the config and flags it needs.
        const delegateTool = createDelegateTaskTool(config, flags);
        toolsToRegister.push(delegateTool);
    }

    for (const tool of toolsToRegister) {
        toolRunner.register(tool);
    }

    return toolRunner;
}