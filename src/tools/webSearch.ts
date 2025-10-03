import { type Tool } from './index.js';

export const webSearchTool: Tool = {
    name: 'web_search',
    description: 'Performs a web search to find up-to-date information on a given topic. Returns a summary of the top results.',
    async execute(args: any[]): Promise<string> {
        const [query] = args;
        if (!query) {
            return 'Error: A search query must be provided.';
        }

        // --- Mock Implementation ---
        // In a real implementation, this would call a search API (e.g., Google, Bing, SerpApi)
        // with an API key from the configuration. For now, we return a hardcoded result.

        const mockResults = [
            {
                title: `What is the capital of France? - WorldInfo`,
                link: `https://example.com/capital-of-france`,
                snippet: `The capital of France is Paris, a major European city and a global center for art, fashion, gastronomy, and culture.`
            },
            {
                title: `Paris - Wikipedia`,
                link: `https://en.wikipedia.org/wiki/Paris`,
                snippet: `Paris is the capital and most populous city of France...`
            }
        ];

        if (query.toLowerCase().includes('france')) {
             return `Search results for "${query}":\n\n` + mockResults.map(r =>
                `Title: ${r.title}\nLink: ${r.link}\nSnippet: ${r.snippet}`
            ).join('\n\n');
        }

        return `Search results for "${query}":\n\n[Mock Result] No specific information found for this query. A real implementation would provide live web results.`;
    }
};