// import { config as loadEnv } from 'dotenv'

// loadEnv()

console.assert(
    process.env.OPENROUTER_API_KEY,
    'OPENROUTER_API_KEY is not set in env variables'
)

export type ModelConfig = {
    apiKey: string;
    httpReferer: string;
    xTitle: string;
    port: number;
    models: string[];
    temperature: number;
    maxTokens: number;
    systemPrompt: string;

    provider: {
        sort: {
            by: string,
            partition: string,
        }
    }
}

export const config: ModelConfig = {
    apiKey: process.env.OPENROUTER_API_KEY!,
    httpReferer: 'http://pos-ia.com',
    xTitle: 'SmartModelRouterGateway',
    port: 3000,
    models: [
        'nvidia/nemotron-3-ultra-550b-a55b:free',
        'inclusionai/ling-3.0-flash:free',
        'openai/gpt-oss-20b:free',
    ],
    temperature: 0.2,
    maxTokens: 50,
    systemPrompt: 'You are a helpful assistant.',
    provider: {
        sort: {
            by: 'throughput',
            // by: 'latency',
            // by: 'price',
            partition: 'none'
        }
    }
}