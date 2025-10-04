// @bun
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// src/core/config.ts
import os from "os";
import path from "path";
import fs from "fs/promises";
async function loadConfig() {
  try {
    await fs.mkdir(configDir, { recursive: true });
    const data = await fs.readFile(configFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}
async function saveConfig(config) {
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(configFile, JSON.stringify(config, null, 2));
}
function getConfigPath() {
  return configFile;
}
var configDir, configFile;
var init_config = __esm(() => {
  configDir = path.join(os.homedir(), ".config", "xcode");
  configFile = path.join(configDir, "config.json");
});

// src/core/history.ts
import os2 from "os";
import path2 from "path";
import fs2 from "fs/promises";
async function loadHistory() {
  try {
    await ensureHistoryDir();
    const data = await fs2.readFile(defaultHistoryFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
async function saveHistory(messages) {
  await ensureHistoryDir();
  const messagesToSave = messages.map(({ role, content, tool_call_id }) => ({ role, content, tool_call_id }));
  await fs2.writeFile(defaultHistoryFile, JSON.stringify(messagesToSave, null, 2));
}
async function clearHistory() {
  try {
    await fs2.unlink(defaultHistoryFile);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
async function listHistories() {
  await ensureHistoryDir();
  const files = await fs2.readdir(historyDir);
  return files.filter((file) => file.endsWith(".json") && file !== "default.json").map((file) => file.replace(".json", ""));
}
async function saveHistoryAs(name) {
  if (!name || name === "default") {
    throw new Error("Invalid checkpoint name.");
  }
  await ensureHistoryDir();
  const destinationFile = path2.join(historyDir, `${name}.json`);
  try {
    await fs2.copyFile(defaultHistoryFile, destinationFile);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("There is no active conversation to save.");
    }
    throw error;
  }
}
async function loadHistoryFrom(name) {
  if (!name || name === "default") {
    throw new Error("Invalid checkpoint name.");
  }
  await ensureHistoryDir();
  const sourceFile = path2.join(historyDir, `${name}.json`);
  try {
    await fs2.copyFile(sourceFile, defaultHistoryFile);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Checkpoint "${name}" not found.`);
    }
    throw error;
  }
}
async function deleteHistoryCheckpoint(name) {
  if (!name || name === "default") {
    throw new Error("Invalid checkpoint name. Cannot delete the default history.");
  }
  const checkpointFile = path2.join(historyDir, `${name}.json`);
  try {
    await fs2.unlink(checkpointFile);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Checkpoint "${name}" not found.`);
    }
    throw error;
  }
}
var configDir2, historyDir, defaultHistoryFile, ensureHistoryDir = async () => fs2.mkdir(historyDir, { recursive: true });
var init_history = __esm(() => {
  configDir2 = path2.join(os2.homedir(), ".config", "xcode");
  historyDir = path2.join(configDir2, "history");
  defaultHistoryFile = path2.join(historyDir, "default.json");
});

// src/core/subagents.ts
import os3 from "os";
import path3 from "path";
import fs3 from "fs/promises";
async function loadAgents() {
  try {
    await fs3.mkdir(configDir3, { recursive: true });
    const data = await fs3.readFile(agentsFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
async function saveAgents(agents) {
  await fs3.mkdir(configDir3, { recursive: true });
  await fs3.writeFile(agentsFile, JSON.stringify(agents, null, 2));
}
var configDir3, agentsFile;
var init_subagents = __esm(() => {
  configDir3 = path3.join(os3.homedir(), ".config", "xcode");
  agentsFile = path3.join(configDir3, "agents.json");
});

// src/tools/index.ts
class ToolRunner {
  tools = new Map;
  register(tool) {
    this.tools.set(tool.name, tool);
  }
  async run(toolName, args) {
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
  getToolSchemas() {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: {}
      }
    }));
  }
  getAvailableTools() {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description
    }));
  }
}

// src/tools/listFiles.ts
import fs4 from "fs/promises";
import path4 from "path";
var listFilesTool;
var init_listFiles = __esm(() => {
  listFilesTool = {
    name: "list_files",
    description: "Lists all files and directories in a specified path. Defaults to the current directory.",
    async execute(args) {
      const targetPath = args[0] || ".";
      try {
        const files = await fs4.readdir(targetPath, { withFileTypes: true });
        const fileList = files.map((file) => {
          const type = file.isDirectory() ? "directory" : "file";
          return `${file.name} (${type})`;
        });
        return `Contents of "${path4.resolve(targetPath)}":
${fileList.join(`
`)}`;
      } catch (error) {
        if (error.code === "ENOENT") {
          return `Error: Directory not found at "${targetPath}"`;
        }
        throw error;
      }
    }
  };
});

// src/tools/readFile.ts
import fs5 from "fs/promises";
var readFileTool;
var init_readFile = __esm(() => {
  readFileTool = {
    name: "read_file",
    description: "Reads the entire content of a specified file.",
    async execute(args) {
      const [filePath] = args;
      if (!filePath) {
        return "Error: A file path must be provided.";
      }
      try {
        const content = await fs5.readFile(filePath, "utf-8");
        return `Content of "${filePath}":

${content}`;
      } catch (error) {
        if (error.code === "ENOENT") {
          return `Error: File not found at "${filePath}"`;
        }
        throw error;
      }
    }
  };
});

// src/tools/createFile.ts
import fs6 from "fs/promises";
import path5 from "path";
var createFileTool;
var init_createFile = __esm(() => {
  createFileTool = {
    name: "create_file",
    description: "Creates a new file at a specified path with the given content. It can also create directories if they do not exist.",
    async execute(args) {
      const [filePath, content] = args;
      if (!filePath) {
        return "Error: A file path must be provided.";
      }
      if (content === undefined) {
        return "Error: Content for the file must be provided.";
      }
      try {
        const dir = path5.dirname(filePath);
        await fs6.mkdir(dir, { recursive: true });
        await fs6.writeFile(filePath, content, "utf-8");
        return `File "${filePath}" created successfully.`;
      } catch (error) {
        return `Error creating file: ${error.message}`;
      }
    }
  };
});

// src/tools/deleteFile.ts
import fs7 from "fs/promises";
var deleteFileTool;
var init_deleteFile = __esm(() => {
  deleteFileTool = {
    name: "delete_file",
    description: "Deletes a specified file.",
    async execute(args) {
      const [filePath] = args;
      if (!filePath) {
        return "Error: A file path must be provided.";
      }
      try {
        await fs7.unlink(filePath);
        return `File "${filePath}" deleted successfully.`;
      } catch (error) {
        if (error.code === "ENOENT") {
          return `Error: File not found at "${filePath}"`;
        }
        throw error;
      }
    }
  };
});

// src/tools/executeCommand.ts
var {$ } = globalThis.Bun;
var executeCommandTool;
var init_executeCommand = __esm(() => {
  executeCommandTool = {
    name: "execute_command",
    description: "Executes a shell command and returns its standard output. Use this for tasks like running tests, installing packages, etc.",
    async execute(args) {
      const [command] = args;
      if (!command) {
        return "Error: A command must be provided.";
      }
      try {
        const { stdout, stderr } = await $.quiet`${$.raw(command)}`;
        let output = "";
        if (stdout) {
          output += `STDOUT:
${stdout.toString()}`;
        }
        if (stderr) {
          output += `
STDERR:
${stderr.toString()}`;
        }
        return output || "Command executed successfully with no output.";
      } catch (error) {
        return `Error executing command: ${error.message}
STDOUT:
${error.stdout?.toString()}
STDERR:
${error.stderr?.toString()}`;
      }
    }
  };
});

// src/clients/mock.ts
class MockClient {
  async generateResponse(messages, tools) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "tool") {
      const textStream2 = async function* () {
        const text = `Okay, I have processed the tool's output. Here is the final answer based on that.`;
        for (const char of text) {
          yield char;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }();
      return { isToolCall: false, textStream: textStream2 };
    }
    if (typeof lastMessage.content !== "string") {
      return { isToolCall: false, textStream: async function* () {
        yield "I can only process text messages.";
      }() };
    }
    const prompt = lastMessage.content.toLowerCase();
    if (prompt.includes("delegate")) {
      const toolCall = {
        id: "call_delegate_789",
        type: "function",
        function: {
          name: "delegate_task",
          arguments: JSON.stringify({ "0": "test_agent", "1": "Please list the files in the current directory." })
        }
      };
      return { isToolCall: true, toolCalls: [toolCall] };
    }
    if (prompt.includes("list")) {
      const toolCall = {
        id: "call_list_123",
        type: "function",
        function: {
          name: "list_files",
          arguments: JSON.stringify({ "0": "." })
        }
      };
      return { isToolCall: true, toolCalls: [toolCall] };
    }
    if (prompt.includes("read")) {
      const match = prompt.match(/read\s+(['"]?)(.*?)\1/);
      const filename = match ? match[2] : "example.txt";
      const toolCall = {
        id: "call_read_456",
        type: "function",
        function: {
          name: "read_file",
          arguments: JSON.stringify({ "0": filename })
        }
      };
      return { isToolCall: true, toolCalls: [toolCall] };
    }
    const textStream = async function* () {
      const text = `Mock response for: "${lastMessage.content}"`;
      for (const char of text) {
        yield char;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }();
    return { isToolCall: false, textStream };
  }
}

// src/clients/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
function toGeminiMessage(msg) {
  if (msg.role === "tool") {
    return {
      role: "tool",
      parts: [{
        functionResponse: {
          name: msg.tool_call_id || "",
          response: {
            name: msg.tool_call_id || "",
            content: msg.content
          }
        }
      }]
    };
  }
  if (Array.isArray(msg.content)) {
    const parts = msg.content.map((toolCall) => ({
      functionCall: {
        name: toolCall.function.name,
        args: JSON.parse(toolCall.function.arguments)
      }
    }));
    return { role: "model", parts };
  }
  return {
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  };
}

class GeminiClient {
  genAI;
  modelName;
  constructor(apiKey, model) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model || "gemini-1.5-flash";
  }
  async generateResponse(messages, tools) {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      tools: [{ functionDeclarations: tools }]
    });
    const history = messages.map(toGeminiMessage);
    const lastMessage = history.pop();
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.parts);
    let aggregatedResponse = "";
    let toolCalls = [];
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      aggregatedResponse += chunkText;
      if (chunk.functionCalls()) {
        toolCalls = chunk.functionCalls().map((fc) => ({
          id: fc.name,
          type: "function",
          function: {
            name: fc.name,
            arguments: JSON.stringify(fc.args)
          }
        }));
      }
    }
    if (toolCalls.length > 0) {
      return { isToolCall: true, toolCalls };
    } else {
      const textStream = async function* () {
        yield aggregatedResponse;
      }();
      return { isToolCall: false, textStream };
    }
  }
}
var init_gemini = () => {};

// src/clients/openai.ts
import OpenAI from "openai";
function toOpenAIMessage(msg) {
  if (msg.role === "tool") {
    return {
      role: "tool",
      tool_call_id: msg.tool_call_id || "",
      content: msg.content
    };
  }
  if (Array.isArray(msg.content)) {
    const toolCalls = msg.content.map((tc) => ({
      id: tc.id,
      type: "function",
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments
      }
    }));
    return { role: "assistant", tool_calls: toolCalls };
  }
  return {
    role: msg.role,
    content: msg.content
  };
}

class OpenAIClient {
  openai;
  model;
  constructor(apiKey, model) {
    this.openai = new OpenAI({ apiKey });
    this.model = model || "gpt-4-turbo";
  }
  async generateResponse(messages, tools) {
    const processedMessages = messages.map(toOpenAIMessage);
    const params = {
      model: this.model,
      messages: processedMessages,
      stream: true
    };
    if (tools.length > 0) {
      params.tools = tools.map((t) => ({ type: "function", function: t }));
      params.tool_choice = "auto";
    }
    const stream = await this.openai.chat.completions.create(params);
    const streamIterator = stream[Symbol.asyncIterator]();
    const firstChunkResult = await streamIterator.next();
    if (firstChunkResult.done) {
      return { isToolCall: false };
    }
    const firstDelta = firstChunkResult.value.choices[0]?.delta;
    if (firstDelta?.tool_calls) {
      const toolCallChunks = [...firstDelta.tool_calls || []];
      for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const existing = toolCallChunks.find((c) => c.index === toolCall.index);
            if (existing) {
              if (toolCall.function?.arguments) {
                existing.function.arguments += toolCall.function.arguments;
              }
            } else {
              toolCallChunks.push(toolCall);
            }
          }
        }
      }
      const finalToolCalls = toolCallChunks.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      }));
      return { isToolCall: true, toolCalls: finalToolCalls };
    } else {
      const textStream = async function* () {
        if (firstDelta?.content) {
          yield firstDelta.content;
        }
        for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      }();
      return { isToolCall: false, textStream };
    }
  }
}
var init_openai = () => {};

// src/clients/claude.ts
import Anthropic from "@anthropic-ai/sdk";
function toClaudeMessage(msg) {
  if (msg.role === "tool") {
    return {
      role: "user",
      content: [{
        type: "tool_result",
        tool_use_id: msg.tool_call_id || "",
        content: msg.content
      }]
    };
  }
  if (msg.role === "assistant" && Array.isArray(msg.content)) {
    const toolUseContent = msg.content.map((toolCall) => ({
      type: "tool_use",
      id: toolCall.id,
      name: toolCall.function.name,
      input: JSON.parse(toolCall.function.arguments)
    }));
    return { role: "assistant", content: toolUseContent };
  }
  return {
    role: msg.role,
    content: msg.content
  };
}

class ClaudeClient {
  anthropic;
  model;
  constructor(apiKey, model) {
    this.anthropic = new Anthropic({ apiKey });
    this.model = model || "claude-3-haiku-20240307";
  }
  async generateResponse(messages, tools) {
    const systemPrompt = "You are a helpful AI assistant.";
    const processedMessages = messages.map(toClaudeMessage);
    const params = {
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: processedMessages,
      stream: true
    };
    if (tools.length > 0) {
      params.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters
      }));
    }
    const stream = await this.anthropic.messages.create(params);
    let isToolCall = false;
    const toolCallChunks = {};
    let textChunks = [];
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "tool_use") {
        isToolCall = true;
        const toolUse = event.delta.tool_use;
        if (!toolCallChunks[toolUse.id]) {
          toolCallChunks[toolUse.id] = { name: toolUse.name, input: "" };
        }
        toolCallChunks[toolUse.id].input += toolUse.input_json_delta;
      } else if (event.type === "message_delta") {
        if (event.delta.stop_reason === "tool_use") {
          isToolCall = true;
        }
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        textChunks.push(event.delta.text);
      }
    }
    if (isToolCall) {
      const finalToolCalls = Object.entries(toolCallChunks).map(([id, { name, input }]) => ({
        id,
        type: "function",
        function: { name, arguments: input }
      }));
      return { isToolCall: true, toolCalls: finalToolCalls };
    } else {
      const textStream = async function* () {
        for (const chunk of textChunks) {
          yield chunk;
        }
      }();
      return { isToolCall: false, textStream };
    }
  }
}
var init_claude = () => {};

// src/clients/groq.ts
import OpenAI2 from "openai";
function toOpenAIMessage2(msg) {
  if (msg.role === "tool") {
    return {
      role: "tool",
      tool_call_id: msg.tool_call_id || "",
      content: msg.content
    };
  }
  if (Array.isArray(msg.content)) {
    const toolCalls = msg.content.map((tc) => ({
      id: tc.id,
      type: "function",
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments
      }
    }));
    return { role: "assistant", tool_calls: toolCalls };
  }
  return {
    role: msg.role,
    content: msg.content
  };
}

class GroqClient {
  groq;
  model;
  constructor(apiKey, model) {
    this.groq = new OpenAI2({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    });
    this.model = model || "llama3-8b-8192";
  }
  async generateResponse(messages, tools) {
    const processedMessages = messages.map(toOpenAIMessage2);
    const params = {
      model: this.model,
      messages: processedMessages,
      stream: true
    };
    if (tools.length > 0) {
      params.tools = tools.map((t) => ({ type: "function", function: t }));
      params.tool_choice = "auto";
    }
    const stream = await this.groq.chat.completions.create(params);
    const streamIterator = stream[Symbol.asyncIterator]();
    const firstChunkResult = await streamIterator.next();
    if (firstChunkResult.done) {
      return { isToolCall: false };
    }
    const firstDelta = firstChunkResult.value.choices[0]?.delta;
    if (firstDelta?.tool_calls) {
      const toolCallChunks = [...firstDelta.tool_calls || []];
      for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const existing = toolCallChunks.find((c) => c.index === toolCall.index);
            if (existing) {
              if (toolCall.function?.arguments) {
                existing.function.arguments += toolCall.function.arguments;
              }
            } else {
              toolCallChunks.push(toolCall);
            }
          }
        }
      }
      const finalToolCalls = toolCallChunks.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      }));
      return { isToolCall: true, toolCalls: finalToolCalls };
    } else {
      const textStream = async function* () {
        if (firstDelta?.content) {
          yield firstDelta.content;
        }
        for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      }();
      return { isToolCall: false, textStream };
    }
  }
}
var init_groq = () => {};

// src/clients/openrouter.ts
import OpenAI3 from "openai";
function toOpenAIMessage3(msg) {
  if (msg.role === "tool") {
    return {
      role: "tool",
      tool_call_id: msg.tool_call_id || "",
      content: msg.content
    };
  }
  if (Array.isArray(msg.content)) {
    const toolCalls = msg.content.map((tc) => ({
      id: tc.id,
      type: "function",
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments
      }
    }));
    return { role: "assistant", tool_calls: toolCalls };
  }
  return {
    role: msg.role,
    content: msg.content
  };
}

class OpenRouterClient {
  openrouter;
  model;
  constructor(apiKey, model) {
    this.openrouter = new OpenAI3({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1"
    });
    this.model = model || "openai/gpt-4o";
  }
  async generateResponse(messages, tools) {
    const processedMessages = messages.map(toOpenAIMessage3);
    const params = {
      model: this.model,
      messages: processedMessages,
      stream: true
    };
    if (tools.length > 0) {
      params.tools = tools.map((t) => ({ type: "function", function: t }));
      params.tool_choice = "auto";
    }
    const stream = await this.openrouter.chat.completions.create(params);
    const streamIterator = stream[Symbol.asyncIterator]();
    const firstChunkResult = await streamIterator.next();
    if (firstChunkResult.done) {
      return { isToolCall: false };
    }
    const firstDelta = firstChunkResult.value.choices[0]?.delta;
    if (firstDelta?.tool_calls) {
      const toolCallChunks = [...firstDelta.tool_calls || []];
      for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const existing = toolCallChunks.find((c) => c.index === toolCall.index);
            if (existing) {
              if (toolCall.function?.arguments) {
                existing.function.arguments += toolCall.function.arguments;
              }
            } else {
              toolCallChunks.push(toolCall);
            }
          }
        }
      }
      const finalToolCalls = toolCallChunks.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      }));
      return { isToolCall: true, toolCalls: finalToolCalls };
    } else {
      const textStream = async function* () {
        if (firstDelta?.content) {
          yield firstDelta.content;
        }
        for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      }();
      return { isToolCall: false, textStream };
    }
  }
}
var init_openrouter = () => {};

// src/clients/qwen.ts
import OpenAI4 from "openai";
function toOpenAIMessage4(msg) {
  if (msg.role === "tool") {
    return {
      role: "tool",
      tool_call_id: msg.tool_call_id || "",
      content: msg.content
    };
  }
  if (Array.isArray(msg.content)) {
    const toolCalls = msg.content.map((tc) => ({
      id: tc.id,
      type: "function",
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments
      }
    }));
    return { role: "assistant", tool_calls: toolCalls };
  }
  return {
    role: msg.role,
    content: msg.content
  };
}

class QwenClient {
  qwen;
  model;
  constructor(apiKey, model) {
    this.qwen = new OpenAI4({
      apiKey,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    });
    this.model = model || "qwen-turbo";
  }
  async generateResponse(messages, tools) {
    const processedMessages = messages.map(toOpenAIMessage4);
    const params = {
      model: this.model,
      messages: processedMessages,
      stream: true
    };
    if (tools.length > 0) {
      params.tools = tools.map((t) => ({ type: "function", function: t }));
      params.tool_choice = "auto";
    }
    const stream = await this.qwen.chat.completions.create(params);
    const streamIterator = stream[Symbol.asyncIterator]();
    const firstChunkResult = await streamIterator.next();
    if (firstChunkResult.done) {
      return { isToolCall: false };
    }
    const firstDelta = firstChunkResult.value.choices[0]?.delta;
    if (firstDelta?.tool_calls) {
      const toolCallChunks = [...firstDelta.tool_calls || []];
      for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const existing = toolCallChunks.find((c) => c.index === toolCall.index);
            if (existing) {
              if (toolCall.function?.arguments) {
                existing.function.arguments += toolCall.function.arguments;
              }
            } else {
              toolCallChunks.push(toolCall);
            }
          }
        }
      }
      const finalToolCalls = toolCallChunks.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      }));
      return { isToolCall: true, toolCalls: finalToolCalls };
    } else {
      const textStream = async function* () {
        if (firstDelta?.content) {
          yield firstDelta.content;
        }
        for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      }();
      return { isToolCall: false, textStream };
    }
  }
}
var init_qwen = () => {};

// src/clients/nvidia.ts
import OpenAI5 from "openai";
function toOpenAIMessage5(msg) {
  if (msg.role === "tool") {
    return {
      role: "tool",
      tool_call_id: msg.tool_call_id || "",
      content: msg.content
    };
  }
  if (Array.isArray(msg.content)) {
    const toolCalls = msg.content.map((tc) => ({
      id: tc.id,
      type: "function",
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments
      }
    }));
    return { role: "assistant", tool_calls: toolCalls };
  }
  return {
    role: msg.role,
    content: msg.content
  };
}

class NvidiaClient {
  openai;
  model;
  constructor(apiKey, model) {
    this.openai = new OpenAI5({
      apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1"
    });
    this.model = model || "nvidia/nemotron-4-340b-instruct";
  }
  async generateResponse(messages, tools) {
    const processedMessages = messages.map(toOpenAIMessage5);
    const params = {
      model: this.model,
      messages: processedMessages,
      stream: true
    };
    if (tools.length > 0) {
      params.tools = tools.map((t) => ({ type: "function", function: t }));
      params.tool_choice = "auto";
    }
    const stream = await this.openai.chat.completions.create(params);
    const streamIterator = stream[Symbol.asyncIterator]();
    const firstChunkResult = await streamIterator.next();
    if (firstChunkResult.done) {
      return { isToolCall: false };
    }
    const firstDelta = firstChunkResult.value.choices[0]?.delta;
    if (firstDelta?.tool_calls) {
      const toolCallChunks = [...firstDelta.tool_calls || []];
      for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const existing = toolCallChunks.find((c) => c.index === toolCall.index);
            if (existing) {
              if (toolCall.function?.arguments) {
                existing.function.arguments += toolCall.function.arguments;
              }
            } else {
              toolCallChunks.push(toolCall);
            }
          }
        }
      }
      const finalToolCalls = toolCallChunks.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      }));
      return { isToolCall: true, toolCalls: finalToolCalls };
    } else {
      const textStream = async function* () {
        if (firstDelta?.content) {
          yield firstDelta.content;
        }
        for await (const chunk of { [Symbol.asyncIterator]: () => streamIterator }) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      }();
      return { isToolCall: false, textStream };
    }
  }
}
var init_nvidia = () => {};
// src/clients/index.ts
function getClient(provider, config, flags) {
  const getApiKey = (providerName) => {
    const key = config[providerName]?.apiKey;
    if (!key) {
      throw new Error(`API key for ${providerName} not found. Please run 'xcode config ${providerName} <YOUR_API_KEY>'.`);
    }
    return key;
  };
  const modelFromFlag = flags.model;
  const modelFromConfig = config[provider]?.defaultModel;
  const selectedModel = modelFromFlag || modelFromConfig;
  switch (provider) {
    case "mock":
      return new MockClient;
    case "gemini":
      return new GeminiClient(getApiKey("gemini"), selectedModel);
    case "openai":
      return new OpenAIClient(getApiKey("openai"), selectedModel);
    case "claude":
      return new ClaudeClient(getApiKey("claude"), selectedModel);
    case "groq":
      return new GroqClient(getApiKey("groq"), selectedModel);
    case "openrouter":
      return new OpenRouterClient(getApiKey("openrouter"), selectedModel);
    case "qwen":
      return new QwenClient(getApiKey("qwen"), selectedModel);
    case "nvidia":
      return new NvidiaClient(getApiKey("nvidia"), selectedModel);
    default:
      throw new Error(`Unknown or unsupported provider: "${provider}"`);
  }
}
var init_clients = __esm(() => {
  init_gemini();
  init_openai();
  init_claude();
  init_groq();
  init_openrouter();
  init_qwen();
  init_nvidia();
});

// src/core/agent_loop.ts
async function* processAgentTurns(config, flags, conversation, agentConfig) {
  const provider = agentConfig?.provider || flags.provider || "mock";
  const model = agentConfig?.model || flags.model;
  const client = getClient(provider, config, { model });
  const toolRunner = initializeToolRunner(config, flags, agentConfig?.tools);
  let messages = [...conversation];
  const isFirstTurn = !messages.some((m) => m.role === "assistant" || m.role === "tool");
  if (isFirstTurn && agentConfig?.persona) {
    const personaMsg = { role: "system", content: agentConfig.persona };
    messages.unshift(personaMsg);
    yield personaMsg;
  }
  const maxTurns = 5;
  for (let turn = 0;turn < maxTurns; turn++) {
    const toolSchemas = toolRunner.getToolSchemas();
    const response = await client.generateResponse(messages, toolSchemas);
    if (response.isToolCall && response.toolCalls) {
      const assistantMsg = { role: "assistant", content: response.toolCalls };
      messages.push(assistantMsg);
      yield assistantMsg;
      for (const toolCall of response.toolCalls) {
        const args = JSON.parse(toolCall.function.arguments);
        const argsArray = Object.values(args);
        const toolResult = await toolRunner.run(toolCall.function.name, argsArray);
        const toolMsg = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult
        };
        messages.push(toolMsg);
        yield toolMsg;
      }
    } else {
      if (response.textStream) {
        yield { role: "assistant", content: response.textStream };
      } else {
        yield { role: "assistant", content: "[No response from AI]" };
      }
      return;
    }
  }
  yield { role: "assistant", content: "The agent reached the maximum number of turns without providing a final answer." };
}
var init_agent_loop = __esm(() => {
  init_agent();
  init_clients();
});

// src/tools/delegateTask.ts
var createDelegateTaskTool = (config) => {
  return {
    name: "delegate_task",
    description: "Delegates a specific task to a specialized sub-agent. Use this when a task requires a specific persona or a limited set of tools. Provide the agent name and a clear, detailed prompt for the task.",
    async execute(args) {
      const [agentName, taskPrompt] = args;
      if (!agentName || !taskPrompt) {
        return "Error: Both agent_name and task_prompt are required.";
      }
      const allAgents = await loadAgents();
      const agentConfig = allAgents.find((a) => a.name === agentName);
      if (!agentConfig) {
        return `Error: Sub-agent with name "${agentName}" not found.`;
      }
      const initialConversation = [{ role: "user", content: taskPrompt }];
      const messageStream = processAgentTurns(config, {}, initialConversation, agentConfig);
      let finalContent = "";
      for await (const message of messageStream) {
        if (message.role === "assistant" && message.content && typeof message.content[Symbol.asyncIterator] === "function") {
          let fullText = "";
          for await (const chunk of message.content) {
            fullText += chunk;
          }
          finalContent = fullText;
        } else if (message.role === "assistant" && typeof message.content === "string") {
          finalContent = message.content;
        }
      }
      if (finalContent) {
        return `Sub-agent "${agentName}" responded: ${finalContent}`;
      }
      return `Sub-agent "${agentName}" finished without a final text response.`;
    }
  };
};
var init_delegateTask = __esm(() => {
  init_subagents();
  init_agent_loop();
});

// src/tools/searchWeb.ts
import { tavily } from "@tavily/core";
var searchWebTool;
var init_searchWeb = __esm(() => {
  init_config();
  searchWebTool = {
    name: "search_web",
    description: "Searches the web for up-to-date information on a given topic. Use this for current events or questions about information not present in the training data.",
    async execute(args) {
      const [query] = args;
      if (!query) {
        return "Error: A search query is required.";
      }
      try {
        const config = await loadConfig();
        const apiKey = config.tavily?.apiKey;
        if (!apiKey) {
          return "Error: Tavily API key not found. Please run `xcode config set tavily <YOUR_API_KEY>`.";
        }
        const client = tavily({ apiKey });
        const response = await client.search(query, {
          maxResults: 5
        });
        const formattedResults = response.results.map((result) => `Title: ${result.title}
URL: ${result.url}
Snippet: ${result.content}`).join(`

`);
        return `Search results for "${query}":
${formattedResults}`;
      } catch (error) {
        return `Error performing web search: ${error.message}`;
      }
    }
  };
});

// src/core/agent.ts
function initializeToolRunner(config, flags, allowedToolNames) {
  const toolRunner = new ToolRunner;
  const toolsToRegisterNames = allowedToolNames || allToolNames;
  for (const toolName of toolsToRegisterNames) {
    const toolImplementation = toolImplementations[toolName];
    if (toolImplementation) {
      const tool = typeof toolImplementation === "function" ? toolImplementation(config, flags) : toolImplementation;
      toolRunner.register(tool);
    }
  }
  return toolRunner;
}
var toolImplementations, allToolNames;
var init_agent = __esm(() => {
  init_listFiles();
  init_readFile();
  init_createFile();
  init_deleteFile();
  init_executeCommand();
  init_delegateTask();
  init_searchWeb();
  toolImplementations = {
    search_web: searchWebTool,
    list_files: listFilesTool,
    read_file: readFileTool,
    create_file: createFileTool,
    delete_file: deleteFileTool,
    execute_command: executeCommandTool,
    delegate_task: createDelegateTaskTool
  };
  allToolNames = Object.keys(toolImplementations);
});

// src/components/Chat.tsx
import React5, { useState as useState4, useEffect as useEffect3, useRef, useCallback } from "react";
import { Box as Box5, Text as Text5, useApp as useApp3, useInput as useInput3 } from "ink";
import TextInput2 from "ink-text-input";
import SyntaxHighlight from "ink-syntax-highlight";
var renderAssistantContent = (content) => {
  if (typeof content === "string") {
    const parts = content.split(/(\`\`\`(?:\w+)?\n[\s\S]*?\n\`\`\`)/);
    return parts.map((part, index) => {
      const codeBlockMatch = part.match(/\`\`\`(\w+)?\n([\s\S]*?)\n\`\`\`/);
      if (codeBlockMatch) {
        const language = codeBlockMatch[1] || "bash";
        const code = codeBlockMatch[2];
        return /* @__PURE__ */ React5.createElement(SyntaxHighlight, {
          key: index,
          code,
          language
        });
      }
      return /* @__PURE__ */ React5.createElement(Text5, {
        key: index
      }, part);
    });
  }
  if (Array.isArray(content)) {
    return /* @__PURE__ */ React5.createElement(Box5, {
      flexDirection: "column",
      borderStyle: "round",
      paddingX: 1,
      borderColor: "gray"
    }, /* @__PURE__ */ React5.createElement(Text5, {
      bold: true
    }, "Requesting Tool Call:"), content.map((toolCall, index) => /* @__PURE__ */ React5.createElement(Box5, {
      key: index,
      flexDirection: "column",
      marginTop: index > 0 ? 1 : 0
    }, /* @__PURE__ */ React5.createElement(Text5, null, "Tool: ", toolCall.function.name), /* @__PURE__ */ React5.createElement(Text5, null, "Arguments: ", toolCall.function.arguments))));
  }
  return /* @__PURE__ */ React5.createElement(Text5, null, "[Streaming content...]");
}, Chat = ({ initialPrompt }) => {
  const { exit } = useApp3();
  const [messages, setMessages] = useState4([]);
  const [input, setInput] = useState4("");
  const [appConfig, setAppConfig] = useState4({});
  const [isRunning, setIsRunning] = useState4(false);
  const isInitialLoad = useRef(true);
  useInput3((_, key) => {
    if (key.escape)
      exit();
  });
  const runAgentConversation = useCallback(async (conversation) => {
    setIsRunning(true);
    const messageStream = processAgentTurns(appConfig, {}, conversation);
    for await (const message of messageStream) {
      if (message.content && typeof message.content[Symbol.asyncIterator] === "function") {
        const stream = message.content;
        const assistantMessage = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMessage]);
        for await (const chunk of stream) {
          setMessages((prev) => prev.map((msg, index) => index === prev.length - 1 ? { ...msg, content: msg.content + chunk } : msg));
        }
      } else {
        setMessages((prev) => [...prev, message]);
      }
    }
    setIsRunning(false);
  }, [appConfig]);
  useEffect3(() => {
    const init = async () => {
      const [history, config] = await Promise.all([loadHistory(), loadConfig()]);
      setAppConfig(config);
      setMessages(history);
      if (initialPrompt) {
        const fullConversation = [...history, { role: "user", content: initialPrompt }];
        setMessages(fullConversation);
        await runAgentConversation(fullConversation);
      }
      isInitialLoad.current = false;
    };
    init();
  }, [initialPrompt, runAgentConversation]);
  useEffect3(() => {
    if (isInitialLoad.current || messages.length === 0)
      return;
    saveHistory(messages);
  }, [messages]);
  const handleSubmit = () => {
    if (!input.trim() || isRunning)
      return;
    const userMessage = { role: "user", content: input };
    const newConversation = [...messages, userMessage];
    setMessages(newConversation);
    runAgentConversation(newConversation);
    setInput("");
  };
  return /* @__PURE__ */ React5.createElement(Box5, {
    flexDirection: "column",
    padding: 1,
    height: "100%"
  }, /* @__PURE__ */ React5.createElement(Box5, {
    flexDirection: "column",
    flexGrow: 1
  }, messages.map((msg, index) => /* @__PURE__ */ React5.createElement(Box5, {
    key: index,
    flexDirection: "column",
    marginBottom: 1
  }, msg.role === "user" && /* @__PURE__ */ React5.createElement(Text5, {
    bold: true,
    color: "cyan"
  }, "You:"), msg.role === "assistant" && /* @__PURE__ */ React5.createElement(Text5, {
    bold: true,
    color: "green"
  }, "AI:"), msg.role === "tool" && /* @__PURE__ */ React5.createElement(Text5, {
    bold: true,
    color: "yellow"
  }, "Tool Output:"), msg.role === "system" && /* @__PURE__ */ React5.createElement(Text5, {
    bold: true,
    color: "gray"
  }, "System:"), renderAssistantContent(msg.content))), isRunning && /* @__PURE__ */ React5.createElement(Text5, null, "...")), /* @__PURE__ */ React5.createElement(TextInput2, {
    value: input,
    onChange: setInput,
    onSubmit: handleSubmit,
    placeholder: isRunning ? "Agent is running..." : "Type your message..."
  }));
}, Chat_default;
var init_Chat = __esm(() => {
  init_history();
  init_config();
  init_agent_loop();
  Chat_default = Chat;
});

// src/components/OneShot.tsx
import React6, { useState as useState5, useEffect as useEffect4 } from "react";
import { Box as Box6, Text as Text6 } from "ink";
import SyntaxHighlight2 from "ink-syntax-highlight";
var renderAssistantContent2 = (content) => {
  const parts = content.split(/(\`\`\`(?:\w+)?\n[\s\S]*?\n\`\`\`)/);
  return parts.map((part, index) => {
    const codeBlockMatch = part.match(/\`\`\`(\w+)?\n([\s\S]*?)\n\`\`\`/);
    if (codeBlockMatch) {
      const language = codeBlockMatch[1] || "bash";
      const code = codeBlockMatch[2];
      return /* @__PURE__ */ React6.createElement(SyntaxHighlight2, {
        key: index,
        code,
        language
      });
    }
    return /* @__PURE__ */ React6.createElement(Text6, {
      key: index
    }, part);
  });
}, OneShot = ({ prompt, responseStream }) => {
  const [responseText, setResponseText] = useState5("");
  useEffect4(() => {
    if (!responseStream)
      return;
    const streamResponse = async () => {
      for await (const chunk of responseStream) {
        setResponseText((prev) => prev + chunk);
      }
    };
    streamResponse();
  }, [responseStream]);
  return /* @__PURE__ */ React6.createElement(Box6, {
    flexDirection: "column",
    padding: 1
  }, /* @__PURE__ */ React6.createElement(Box6, {
    flexDirection: "column",
    marginBottom: 1
  }, /* @__PURE__ */ React6.createElement(Text6, {
    bold: true,
    color: "cyan"
  }, "You:"), /* @__PURE__ */ React6.createElement(Text6, null, prompt)), /* @__PURE__ */ React6.createElement(Box6, {
    flexDirection: "column"
  }, /* @__PURE__ */ React6.createElement(Text6, {
    bold: true,
    color: "green"
  }, "AI:"), renderAssistantContent2(responseText)));
}, OneShot_default;
var init_OneShot = __esm(() => {
  OneShot_default = OneShot;
});

// src/components/AgentOutput.tsx
import React7, { useState as useState6, useEffect as useEffect5 } from "react";
import { Box as Box7, Text as Text7 } from "ink";
import SyntaxHighlight3 from "ink-syntax-highlight";
var renderAssistantContent3 = (content) => {
  const parts = content.split(/(\`\`\`(?:\w+)?\n[\s\S]*?\n\`\`\`)/);
  return parts.map((part, index) => {
    const codeBlockMatch = part.match(/\`\`\`(\w+)?\n([\s\S]*?)\n\`\`\`/);
    if (codeBlockMatch) {
      const language = codeBlockMatch[1] || "bash";
      const code = codeBlockMatch[2];
      return /* @__PURE__ */ React7.createElement(SyntaxHighlight3, {
        key: index,
        code,
        language
      });
    }
    return /* @__PURE__ */ React7.createElement(Text7, {
      key: index
    }, part);
  });
}, renderContent = (content) => {
  if (typeof content === "string") {
    return /* @__PURE__ */ React7.createElement(Box7, {
      flexDirection: "column"
    }, renderAssistantContent3(content));
  }
  if (Array.isArray(content)) {
    return /* @__PURE__ */ React7.createElement(Box7, {
      flexDirection: "column",
      borderStyle: "round",
      paddingX: 1,
      borderColor: "gray"
    }, /* @__PURE__ */ React7.createElement(Text7, {
      bold: true
    }, "Requesting Tool Call:"), content.map((toolCall, index) => /* @__PURE__ */ React7.createElement(Box7, {
      key: index,
      flexDirection: "column",
      marginTop: index > 0 ? 1 : 0
    }, /* @__PURE__ */ React7.createElement(Text7, null, "Tool: ", toolCall.function.name), /* @__PURE__ */ React7.createElement(Text7, null, "Arguments: ", toolCall.function.arguments))));
  }
  return /* @__PURE__ */ React7.createElement(Text7, null, "[Streaming content...]");
}, AgentOutput = ({ messageStream }) => {
  const [messages, setMessages] = useState6([]);
  useEffect5(() => {
    const processStream = async () => {
      for await (const message of messageStream) {
        if (message.content && typeof message.content[Symbol.asyncIterator] === "function") {
          const stream = message.content;
          const assistantMessage = { role: "assistant", content: "" };
          setMessages((prev) => [...prev, assistantMessage]);
          for await (const chunk of stream) {
            setMessages((prev) => prev.map((msg, index) => index === prev.length - 1 ? { ...msg, content: msg.content + chunk } : msg));
          }
        } else {
          setMessages((prev) => [...prev, message]);
        }
      }
    };
    processStream();
  }, [messageStream]);
  return /* @__PURE__ */ React7.createElement(Box7, {
    flexDirection: "column",
    paddingY: 1
  }, messages.map((msg, index) => {
    const key = msg.id ?? index;
    switch (msg.role) {
      case "user":
        return /* @__PURE__ */ React7.createElement(Box7, {
          key,
          flexDirection: "column",
          marginBottom: 1
        }, /* @__PURE__ */ React7.createElement(Text7, {
          bold: true,
          color: "cyan"
        }, "You:"), /* @__PURE__ */ React7.createElement(Text7, null, msg.content));
      case "system":
        return /* @__PURE__ */ React7.createElement(Box7, {
          key,
          flexDirection: "column",
          marginBottom: 1,
          paddingX: 1,
          borderStyle: "round",
          borderColor: "gray"
        }, /* @__PURE__ */ React7.createElement(Text7, {
          italic: true,
          color: "gray"
        }, msg.content));
      case "assistant":
        return /* @__PURE__ */ React7.createElement(Box7, {
          key,
          flexDirection: "column",
          marginBottom: 1
        }, /* @__PURE__ */ React7.createElement(Text7, {
          bold: true,
          color: "green"
        }, "AI:"), renderContent(msg.content));
      case "tool":
        return /* @__PURE__ */ React7.createElement(Box7, {
          key,
          flexDirection: "column",
          marginY: 1,
          borderStyle: "single",
          paddingX: 1,
          borderColor: "yellow"
        }, /* @__PURE__ */ React7.createElement(Text7, {
          bold: true,
          color: "yellow"
        }, "Tool Output:"), /* @__PURE__ */ React7.createElement(Text7, null, msg.content));
      default:
        return null;
    }
  }));
}, AgentOutput_default;
var init_AgentOutput = __esm(() => {
  AgentOutput_default = AgentOutput;
});

// src/run.ts
var exports_run = {};
__export(exports_run, {
  default: () => run_default
});
import React8 from "react";
import { render } from "ink";
async function run_default(prompt, flags, isAgentMode) {
  const config = await loadConfig();
  if (prompt) {
    if (isAgentMode) {
      const initialConversation = [{ role: "user", content: prompt }];
      const messageStream = processAgentTurns(config, flags, initialConversation);
      render(React8.createElement(AgentOutput_default, {
        messageStream
      }));
    } else {
      const provider = flags.provider || "mock";
      const client = getClient(provider, config, flags);
      const response = await client.generateResponse([{ role: "user", content: prompt }], []);
      render(React8.createElement(OneShot_default, { prompt, responseStream: response.textStream }));
    }
  } else {
    render(React8.createElement(Chat_default, { initialPrompt: "" }));
  }
}
var init_run = __esm(() => {
  init_Chat();
  init_OneShot();
  init_AgentOutput();
  init_config();
  init_clients();
  init_agent_loop();
});

// src/index.ts
init_config();
init_history();
init_subagents();
import React9 from "react";
import { render as render2 } from "ink";
import meow from "meow";

// src/components/ListAgents.tsx
import React from "react";
import { Box, Text } from "ink";
var ListAgents = ({ agents }) => {
  if (agents.length === 0) {
    return /* @__PURE__ */ React.createElement(Text, null, "No custom agents found. Use 'xcode agent create' to build one.");
  }
  return /* @__PURE__ */ React.createElement(Box, {
    flexDirection: "column",
    paddingY: 1
  }, /* @__PURE__ */ React.createElement(Text, {
    bold: true,
    underline: true
  }, "Available Custom Agents:"), agents.map((agent, index) => /* @__PURE__ */ React.createElement(Box, {
    key: index,
    flexDirection: "column",
    paddingY: 1,
    borderStyle: "round",
    borderColor: "gray"
  }, /* @__PURE__ */ React.createElement(Text, {
    bold: true,
    color: "cyan"
  }, "Name:"), /* @__PURE__ */ React.createElement(Text, null, agent.name), /* @__PURE__ */ React.createElement(Text, {
    bold: true,
    color: "cyan",
    marginTop: 1
  }, "Persona:"), /* @__PURE__ */ React.createElement(Text, null, agent.persona), /* @__PURE__ */ React.createElement(Text, {
    bold: true,
    color: "cyan",
    marginTop: 1
  }, "Tools:"), /* @__PURE__ */ React.createElement(Text, null, agent.tools.join(", ")))));
};
var ListAgents_default = ListAgents;

// src/components/AgentForm.tsx
import React3, { useState as useState2, useEffect } from "react";
import { Box as Box3, Text as Text3, useApp } from "ink";
import TextInput from "ink-text-input";

// src/components/MultiSelect.tsx
import React2, { useState } from "react";
import { Box as Box2, Text as Text2, useInput } from "ink";
var MultiSelect = ({ items: initialItems, onSelect }) => {
  const [items, setItems] = useState(initialItems);
  const [focusedIndex, setFocusedIndex] = useState(0);
  useInput((input, key) => {
    if (key.upArrow) {
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setFocusedIndex((prev) => Math.min(items.length - 1, prev + 1));
    }
    if (input === " ") {
      setItems((prevItems) => prevItems.map((item, index) => index === focusedIndex ? { ...item, isSelected: !item.isSelected } : item));
    }
    if (key.return) {
      onSelect(items);
    }
  });
  return /* @__PURE__ */ React2.createElement(Box2, {
    flexDirection: "column"
  }, items.map((item, index) => {
    const isFocused = index === focusedIndex;
    const checkbox = item.isSelected ? "[x]" : "[ ]";
    return /* @__PURE__ */ React2.createElement(Text2, {
      key: item.value,
      color: isFocused ? "cyan" : "white"
    }, isFocused ? "> " : "  ", checkbox, " ", item.label);
  }));
};
var MultiSelect_default = MultiSelect;

// src/components/AgentForm.tsx
init_subagents();
init_agent();
var AgentForm = ({ agentToEdit }) => {
  const { exit } = useApp();
  const [mode] = useState2(agentToEdit ? "edit" : "create");
  const [step, setStep] = useState2(mode === "create" ? "name" : "persona");
  const [existingAgents, setExistingAgents] = useState2([]);
  const [error, setError] = useState2(null);
  const [agentData, setAgentData] = useState2(agentToEdit || {
    name: "",
    persona: "",
    provider: "",
    model: "",
    tools: []
  });
  useEffect(() => {
    loadAgents().then(setExistingAgents);
  }, []);
  const handleNameSubmit = (name) => {
    if (!name) {
      setError("Agent name cannot be empty.");
      return;
    }
    if (existingAgents.some((agent) => agent.name === name)) {
      setError(`An agent with the name "${name}" already exists.`);
      return;
    }
    setAgentData((prev) => ({ ...prev, name }));
    setError(null);
    setStep("persona");
  };
  const handlePersonaSubmit = (persona) => {
    setAgentData((prev) => ({ ...prev, persona }));
    setStep("provider");
  };
  const handleProviderSubmit = (provider) => {
    setAgentData((prev) => ({ ...prev, provider }));
    setStep("model");
  };
  const handleModelSubmit = (model) => {
    setAgentData((prev) => ({ ...prev, model }));
    setStep("tools");
  };
  const handleToolsSubmit = (items) => {
    const selectedTools = items.filter((item) => item.isSelected).map((item) => item.value);
    const finalAgent = { ...agentData, tools: selectedTools };
    let updatedAgents;
    if (mode === "edit") {
      updatedAgents = existingAgents.map((agent) => agent.name === finalAgent.name ? finalAgent : agent);
    } else {
      updatedAgents = [...existingAgents, finalAgent];
    }
    saveAgents(updatedAgents).then(() => {
      setStep("done");
    });
  };
  useEffect(() => {
    if (step === "done") {
      setTimeout(exit, 1000);
    }
  }, [step, exit]);
  const renderStep = () => {
    switch (step) {
      case "name":
        return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(Text3, null, "Enter a unique name for the new agent:"), /* @__PURE__ */ React3.createElement(TextInput, {
          value: agentData.name || "",
          onChange: (val) => setAgentData((p) => ({ ...p, name: val })),
          onSubmit: handleNameSubmit
        }));
      case "persona":
        return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(Text3, null, "Describe the agent's persona:"), /* @__PURE__ */ React3.createElement(TextInput, {
          value: agentData.persona || "",
          onChange: (val) => setAgentData((p) => ({ ...p, persona: val })),
          onSubmit: handlePersonaSubmit
        }));
      case "provider":
        return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(Text3, null, "Enter the AI provider (e.g., openai). Leave blank for default:"), /* @__PURE__ */ React3.createElement(TextInput, {
          value: agentData.provider || "",
          onChange: (val) => setAgentData((p) => ({ ...p, provider: val })),
          onSubmit: handleProviderSubmit
        }));
      case "model":
        return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(Text3, null, "Enter a specific model. Leave blank for default:"), /* @__PURE__ */ React3.createElement(TextInput, {
          value: agentData.model || "",
          onChange: (val) => setAgentData((p) => ({ ...p, model: val })),
          onSubmit: handleModelSubmit
        }));
      case "tools":
        const toolItems = allToolNames.map((name) => ({
          label: name,
          value: name,
          isSelected: agentData.tools?.includes(name) || false
        }));
        return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(Text3, null, "Select the tools this agent can use (Space to select, Enter to confirm):"), /* @__PURE__ */ React3.createElement(MultiSelect_default, {
          items: toolItems,
          onSelect: handleToolsSubmit
        }));
      case "done":
        const action = mode === "edit" ? "updated" : "created";
        return /* @__PURE__ */ React3.createElement(Text3, {
          color: "green"
        }, 'Agent "', agentData.name, '" ', action, " successfully!");
    }
  };
  return /* @__PURE__ */ React3.createElement(Box3, {
    flexDirection: "column",
    padding: 1
  }, /* @__PURE__ */ React3.createElement(Text3, {
    bold: true
  }, mode === "edit" ? `Editing Agent: ${agentToEdit?.name}` : "Create New Sub-Agent"), /* @__PURE__ */ React3.createElement(Box3, {
    flexDirection: "column",
    marginTop: 1
  }, renderStep(), error && /* @__PURE__ */ React3.createElement(Text3, {
    color: "red"
  }, error)));
};
var AgentForm_default = AgentForm;

// src/components/DeleteAgentConfirmation.tsx
import React4, { useState as useState3, useEffect as useEffect2 } from "react";
import { Box as Box4, Text as Text4, useApp as useApp2 } from "ink";

// src/components/Confirm.tsx
import { useInput as useInput2 } from "ink";
var Confirm = ({ onConfirm }) => {
  useInput2((input, key) => {
    if (input.toLowerCase() === "y" || key.return) {
      onConfirm(true);
    } else if (input.toLowerCase() === "n" || key.escape) {
      onConfirm(false);
    }
  });
  return null;
};
var Confirm_default = Confirm;

// src/components/DeleteAgentConfirmation.tsx
init_subagents();
var DeleteAgentConfirmation = ({ agentName }) => {
  const { exit } = useApp2();
  const [status, setStatus] = useState3("loading");
  useEffect2(() => {
    const findAgent = async () => {
      const agents = await loadAgents();
      const agentExists = agents.some((agent) => agent.name === agentName);
      if (agentExists) {
        setStatus("confirming");
      } else {
        setStatus("notFound");
      }
    };
    findAgent();
  }, [agentName]);
  const handleConfirm = async (confirmed) => {
    if (confirmed) {
      const agents = await loadAgents();
      const updatedAgents = agents.filter((agent) => agent.name !== agentName);
      await saveAgents(updatedAgents);
      setStatus("deleted");
    } else {
      setStatus("cancelled");
    }
  };
  useEffect2(() => {
    if (status === "deleted" || status === "cancelled" || status === "notFound") {
      setTimeout(exit, 1000);
    }
  }, [status, exit]);
  switch (status) {
    case "loading":
      return /* @__PURE__ */ React4.createElement(Text4, null, 'Searching for agent "', agentName, '"...');
    case "notFound":
      return /* @__PURE__ */ React4.createElement(Text4, {
        color: "red"
      }, 'Agent "', agentName, '" not found.');
    case "confirming":
      return /* @__PURE__ */ React4.createElement(Box4, null, /* @__PURE__ */ React4.createElement(Text4, null, 'Are you sure you want to delete the agent "', agentName, '"? (y/n) '), /* @__PURE__ */ React4.createElement(Confirm_default, {
        onConfirm: handleConfirm
      }));
    case "deleted":
      return /* @__PURE__ */ React4.createElement(Text4, {
        color: "green"
      }, 'Agent "', agentName, '" has been deleted.');
    case "cancelled":
      return /* @__PURE__ */ React4.createElement(Text4, {
        color: "yellow"
      }, "Deletion cancelled.");
    default:
      return null;
  }
};
var DeleteAgentConfirmation_default = DeleteAgentConfirmation;

// src/index.ts
var cli = meow(`
	Usage
	  $ xcode [prompt]
	  $ xcode agent [sub-command] [prompt]
    $ cat <file> | xcode [prompt]

	Commands
	  agent [prompt]                  Run the default agent with tool-use capabilities
	  agent create                    Interactively create a new custom sub-agent
	  agent list                      List all available custom sub-agents
	  agent edit <name>               Interactively edit a custom sub-agent
	  agent delete <name>             Delete a custom sub-agent
	  config get                      Show the current configuration (keys redacted)
	  config path                     Show the path to the configuration file
	  config set <provider> <apiKey>  Set API key for a provider
	  history list                    List all saved conversation checkpoints
	  history save <name>             Save the current conversation as a checkpoint
	  history load <name>             Load a conversation from a checkpoint
	  history delete <name>           Delete a conversation checkpoint
	  history clear                   Clear the current conversation history

	Options
		--provider, -p    AI provider to use (e.g., gemini, claude, nvidia)
		--model, -m       Specify a model to use for the selected provider

	Examples
	  $ xcode "Hello, world!"
	  $ xcode agent "Read 'test.txt' and summarize it." --provider openai
	  $ xcode agent create
	  $ xcode agent list
	  $ xcode agent edit code_reviewer
	  $ xcode agent delete code_reviewer
	  $ xcode config set openai sk-xxxxxxxx
	  $ xcode config get
    $ cat file.js | xcode "Refactor this code."
`, {
  importMeta: import.meta,
  flags: {
    provider: {
      type: "string",
      shortFlag: "p"
    },
    model: {
      type: "string",
      shortFlag: "m"
    }
  }
});
async function readStdin() {
  if (process.stdin.isTTY) {
    return "";
  }
  let result = "";
  for await (const chunk of process.stdin) {
    result += chunk;
  }
  return result;
}
async function main() {
  const { input, flags } = cli;
  const command = input[0];
  const subCommand = input[1];
  if (command === "config") {
    const name = input[2];
    const value = input[3];
    if (subCommand === "get") {
      const config = await loadConfig();
      const redactedConfig = { ...config };
      for (const provider in redactedConfig) {
        if (redactedConfig[provider]?.apiKey) {
          redactedConfig[provider].apiKey = "********";
        }
      }
      console.log(JSON.stringify(redactedConfig, null, 2));
      return;
    }
    if (subCommand === "path") {
      console.log(getConfigPath());
      return;
    }
    if (subCommand === "set") {
      if (!name || !value) {
        console.error('Error: Please provide both a provider/key and a value for the "set" command.');
        cli.showHelp();
        return;
      }
      const config = await loadConfig();
      if (!config[name]) {
        config[name] = {};
      }
      config[name].apiKey = value;
      await saveConfig(config);
      console.log(`Configuration for ${name} saved.`);
      return;
    }
    console.error('Invalid "config" command. Use "get", "path", or "set".');
    cli.showHelp();
    return;
  }
  if (command === "history") {
    const name = input[2];
    try {
      switch (subCommand) {
        case "list":
          const histories = await listHistories();
          if (histories.length === 0) {
            console.log("No saved conversation checkpoints found.");
          } else {
            console.log("Saved conversation checkpoints:");
            histories.forEach((h) => console.log(`- ${h}`));
          }
          break;
        case "save":
          if (!name) {
            console.error("Error: A name is required to save the history checkpoint.");
            return;
          }
          await saveHistoryAs(name);
          console.log(`Conversation saved as "${name}".`);
          break;
        case "load":
          if (!name) {
            console.error("Error: A name is required to load a history checkpoint.");
            return;
          }
          await loadHistoryFrom(name);
          console.log(`Conversation "${name}" loaded. Start a new session to use it.`);
          break;
        case "delete":
          if (!name) {
            console.error("Error: A name is required to delete a history checkpoint.");
            return;
          }
          await deleteHistoryCheckpoint(name);
          console.log(`Conversation checkpoint "${name}" deleted.`);
          break;
        case "clear":
          await clearHistory();
          console.log("Current conversation history cleared.");
          break;
        default:
          console.error("Invalid history command. Use list, save, load, delete, or clear.");
          cli.showHelp();
          break;
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
    return;
  }
  const stdinContent = await readStdin();
  if (command === "agent") {
    if (subCommand === "list") {
      const agents = await loadAgents();
      render2(React9.createElement(ListAgents_default, { agents }));
      return;
    }
    if (subCommand === "create") {
      render2(React9.createElement(AgentForm_default));
      return;
    }
    if (subCommand === "edit") {
      const agentName = input[2];
      if (!agentName) {
        console.error("Error: Please provide the name of the agent to edit.");
        cli.showHelp();
        return;
      }
      const agents = await loadAgents();
      const agentToEdit = agents.find((a) => a.name === agentName);
      if (!agentToEdit) {
        console.error(`Error: Agent "${agentName}" not found.`);
        return;
      }
      render2(React9.createElement(AgentForm_default, { agentToEdit }));
      return;
    }
    if (subCommand === "delete") {
      const agentName = input[2];
      if (!agentName) {
        console.error("Error: Please provide the name of the agent to delete.");
        cli.showHelp();
        return;
      }
      render2(React9.createElement(DeleteAgentConfirmation_default, { agentName }));
      return;
    }
    const agentCliInput = input.slice(1).join(" ");
    let agentPrompt = agentCliInput;
    if (stdinContent) {
      agentPrompt = `The following content was piped into the command:

${stdinContent}

---

${agentCliInput}`;
    }
    if (!agentPrompt.trim()) {
      cli.showHelp();
      return;
    }
    const { default: run } = await Promise.resolve().then(() => (init_run(), exports_run));
    run(agentPrompt, flags, true);
    return;
  }
  const cliInput = input.join(" ");
  let finalPrompt = cliInput;
  if (stdinContent) {
    finalPrompt = `The following content was piped into the command:

${stdinContent}

---

${cliInput}`;
  }
  if (!finalPrompt.trim() && process.stdin.isTTY) {
    const { default: run } = await Promise.resolve().then(() => (init_run(), exports_run));
    run("", flags, false);
  } else if (finalPrompt.trim()) {
    const { default: run } = await Promise.resolve().then(() => (init_run(), exports_run));
    run(finalPrompt, flags, false);
  } else {
    cli.showHelp();
  }
}
main();
