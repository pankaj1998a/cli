import { ToolRunner } from '../tools/index.js';
import { listFilesTool } from '../tools/listFiles.js';
import { readFileTool } from '../tools/readFile.js';
import { createFileTool } from '../tools/createFile.js';
import { deleteFileTool } from '../tools/deleteFile.js';
import { executeCommandTool } from '../tools/executeCommand.js';
import { createDelegateTaskTool } from '../tools/delegateTask.js';
import { editFileTool } from '../tools/editFile.js';
import { webSearchTool } from '../tools/webSearch.js';
import { startProcessTool } from '../tools/startProcess.js';
import { checkStatusTool } from '../tools/checkStatus.js';
import { stopProcessTool } from '../tools/stopProcess.js';
import { type AiClient } from './types.js';

const allTools = [
    listFilesTool,
    readFileTool,
    createFileTool,
    deleteFileTool,
    executeCommandTool,
    editFileTool,
    webSearchTool,
    startProcessTool,
    checkStatusTool,
    stopProcessTool,
];

export function initializeToolRunner(client: AiClient, allowedToolNames?: string[]): ToolRunner {
    const toolRunner = new ToolRunner();

    let toolsToRegister = [...allTools];

    // If a list of allowed tools is provided, filter the list.
    if (allowedToolNames) {
        toolsToRegister = allTools.filter(tool => allowedToolNames.includes(tool.name));
    } else {
        // If no specific tools are allowed, it's the main agent.
        // Add the delegation tool.
        const delegateTool = createDelegateTaskTool(client);
        toolsToRegister.push(delegateTool);
    }

    for (const tool of toolsToRegister) {
        toolRunner.register(tool);
    }

    return toolRunner;
}