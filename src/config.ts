import 'dotenv/config'
import { routingStrategies, type RoutingStrategy } from './types.ts'

const fallbackModels = [
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'inclusionai/ling-3.0-flash:free',
    'openai/gpt-oss-20b:free',
]

const parseModels = (value?: string): string[] => {
    const models = value
        ?.split(',')
        .map((model) => model.trim())
        .filter(Boolean)

    return models?.length ? models : fallbackModels
}

const parseStrategy = (value?: string): RoutingStrategy => {
    return routingStrategies.includes(value as RoutingStrategy)
        ? value as RoutingStrategy
        : 'throughput'
}

export type RouterConfig = {
    apiKey: string
    httpReferer: string
    xTitle: string
    port: number
    models: string[]
    defaultStrategy: RoutingStrategy
    temperature: number
    maxTokens: number
    maxPromptChars: number
    systemPrompt: string
    providerPartition: string
}

export const config: RouterConfig = {
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    httpReferer: process.env.OPENROUTER_HTTP_REFERER ?? 'https://github.com/bielfelix/smart-model-router-gateway',
    xTitle: process.env.OPENROUTER_APP_TITLE ?? 'Smart Model Router Gateway',
    port: Number(process.env.PORT ?? 3000),
    models: parseModels(process.env.ROUTER_MODELS),
    defaultStrategy: parseStrategy(process.env.ROUTER_STRATEGY),
    temperature: Number(process.env.ROUTER_TEMPERATURE ?? 0.2),
    maxTokens: Number(process.env.ROUTER_MAX_TOKENS ?? 256),
    maxPromptChars: Number(process.env.ROUTER_MAX_PROMPT_CHARS ?? 8000),
    systemPrompt: process.env.ROUTER_SYSTEM_PROMPT ?? 'You are a helpful assistant.',
    providerPartition: process.env.ROUTER_PROVIDER_PARTITION ?? 'none',
}
