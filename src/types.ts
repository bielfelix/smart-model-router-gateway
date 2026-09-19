export const routingStrategies = ['throughput', 'latency', 'price'] as const

export type RoutingStrategy = typeof routingStrategies[number]

export type ProviderRequest = {
    model: string
    question: string
    systemPrompt: string
    strategy: RoutingStrategy
    temperature: number
    maxTokens: number
}

export type ProviderResponse = {
    model: string
    content: string
}

export interface ModelProvider {
    generate(input: ProviderRequest): Promise<ProviderResponse>
}

export type RoutingAttempt = {
    model: string
    success: boolean
    latencyMs: number
}

export type RoutedResponse = {
    requestId: string
    strategy: RoutingStrategy
    model: string
    content: string
    attempts: RoutingAttempt[]
    totalLatencyMs: number
}
