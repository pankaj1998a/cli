import { type Tool } from './index.js';
import Tavily from '@tavily/core';
import { loadConfig } from '../core/config.js';

export const searchWebTool: Tool = {
    name: 'search_web',
    description: 'Searches the web for up-to-date information on a given topic. Use this for current events or questions about information not present in the training data.',
    async execute(args: any[]): Promise<string> {
        const [query] = args;
        if (!query) {
            return 'Error: A search query is required.';
        }

        try {
            const config = await loadConfig();
            const apiKey = config.tavily?.apiKey;

            if (!apiKey) {
                return 'Error: Tavily API key not found. Please run `xcode config set tavily <YOUR_API_KEY>`.';
            }

            const tavily = new Tavily({ apiKey });
            const response = await tavily.search(query, {
                maxResults: 5, // Keep the context concise for the LLM
            });

            // Format the results into a string that is easy for the LLM to parse.
            const formattedResults = response.results.map(
                (result: { title: string; url: string; content: string }) =>
                    `Title: ${result.title}\nURL: ${result.url}\nSnippet: ${result.content}`
            ).join('\n\n');

            return `Search results for "${query}":\n${formattedResults}`;

        } catch (error) {
            // It's better to return a descriptive error message than to crash the agent.
            return `Error performing web search: ${error.message}`;
        }
    }
};