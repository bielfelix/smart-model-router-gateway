import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import type { RouterConfig } from './config.ts'
import {
    routingStrategies,
    type ModelProvider,
    type RoutedResponse,
    type RoutingAttempt,
    type RoutingStrategy,
} from './types.ts'

export class RequestLimitError extends Error {}

export class RoutingExhaustedError extends Error {
    public readonly requestId: string
    public readonly attempts: RoutingAttempt[]

    constructor(requestId: string, attempts: RoutingAttempt[]) {
        super('All configured models failed')
        this.requestId = requestId
        this.attempts = attempts
    }
}

export type GenerateOptions = {
    strategy?: RoutingStrategy
    maxTokens?: number
}

export class ModelRouter {
    private readonly provider: ModelProvider
    private readonly config: RouterConfig

    constructor(provider: ModelProvider, config: RouterConfig) {
        this.provider = provider
        this.config = config
    }

    capabilities() {
        return {
            strategies: routingStrategies,
            modelCount: this.config.models.length,
            defaultStrategy: this.config.defaultStrategy,
            maxTokens: this.config.maxTokens,
            maxPromptChars: this.config.maxPromptChars,
        }
    }

    async generate(question: string, options: GenerateOptions = {}): Promise<RoutedResponse> {
        const normalizedQuestion = question.trim()

        if (normalizedQuestion.length < 5) {
            throw new RequestLimitError('Question must contain at least 5 characters')
        }

        if (normalizedQuestion.length > this.config.maxPromptChars) {
            throw new RequestLimitError(`Question exceeds the ${this.config.maxPromptChars}-character limit`)
        }

        const strategy = options.strategy ?? this.config.defaultStrategy

        if (!routingStrategies.includes(strategy)) {
            throw new RequestLimitError('Unsupported routing strategy')
        }

        const maxTokens = options.maxTokens ?? this.config.maxTokens

        if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > this.config.maxTokens) {
            throw new RequestLimitError(`max_tokens must be between 1 and ${this.config.maxTokens}`)
        }

        const requestId = randomUUID()
        const attempts: RoutingAttempt[] = []
        const requestStartedAt = performance.now()

        for (const model of this.config.models) {
            const attemptStartedAt = performance.now()

            try {
                const result = await this.provider.generate({
                    model,
                    question: normalizedQuestion,
                    systemPrompt: this.config.systemPrompt,
                    strategy,
                    temperature: this.config.temperature,
                    maxTokens,
                })

                attempts.push({
                    model,
                    success: true,
                    latencyMs: Math.round(performance.now() - attemptStartedAt),
                })

                return {
                    requestId,
                    strategy,
                    model: result.model,
                    content: result.content,
                    attempts,
                    totalLatencyMs: Math.round(performance.now() - requestStartedAt),
                }
            } catch {
                attempts.push({
                    model,
                    success: false,
                    latencyMs: Math.round(performance.now() - attemptStartedAt),
                })
            }
        }

        throw new RoutingExhaustedError(requestId, attempts)
    }
}
