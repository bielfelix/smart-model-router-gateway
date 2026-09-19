import { OpenRouter } from '@openrouter/sdk'
import { type ChatGenerationParams } from '@openrouter/sdk/models'
import type { RouterConfig } from './config.ts'
import type { ModelProvider, ProviderRequest, ProviderResponse } from './types.ts'

export class OpenRouterService implements ModelProvider {
    private readonly client: OpenRouter

    constructor(private readonly config: RouterConfig) {
        if (!config.apiKey) {
            throw new Error('OPENROUTER_API_KEY is required to start the gateway')
        }

        this.client = new OpenRouter({
            apiKey: config.apiKey,
            httpReferer: config.httpReferer,
            xTitle: config.xTitle,
        })
    }

    async generate(input: ProviderRequest): Promise<ProviderResponse> {
        const response = await this.client.chat.send({
            models: [input.model],
            messages: [
                { role: 'system', content: input.systemPrompt },
                { role: 'user', content: input.question },
            ],
            stream: false,
            temperature: input.temperature,
            maxTokens: input.maxTokens,
            provider: {
                sort: {
                    by: input.strategy,
                    partition: this.config.providerPartition,
                },
            } as ChatGenerationParams['provider'],
        })

        const content = response.choices.at(0)?.message.content?.toString().trim()

        if (!content) {
            throw new Error('Provider returned an empty response')
        }

        return {
            model: response.model || input.model,
            content,
        }
    }
}
