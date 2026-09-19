import assert from 'node:assert/strict'
import test from 'node:test'
import type { RouterConfig } from '../src/config.ts'
import { ModelRouter } from '../src/modelRouter.ts'
import { createServer } from '../src/server.ts'
import type { ModelProvider, ProviderRequest, ProviderResponse } from '../src/types.ts'

class FakeProvider implements ModelProvider {
    public readonly calls: ProviderRequest[] = []
    private readonly failingModels: Set<string>

    constructor(failingModels = new Set<string>()) {
        this.failingModels = failingModels
    }

    async generate(input: ProviderRequest): Promise<ProviderResponse> {
        this.calls.push(input)

        if (this.failingModels.has(input.model)) {
            throw new Error('simulated provider failure')
        }

        return {
            model: input.model,
            content: `response from ${input.model}`,
        }
    }
}

const makeConfig = (): RouterConfig => ({
    apiKey: '',
    httpReferer: 'https://example.com',
    xTitle: 'test',
    port: 3000,
    models: ['model-a', 'model-b', 'model-c'],
    defaultStrategy: 'throughput',
    temperature: 0.2,
    maxTokens: 256,
    maxPromptChars: 1000,
    systemPrompt: 'Test system prompt',
    providerPartition: 'none',
})

test('routes through the first configured model when it succeeds', async () => {
    const provider = new FakeProvider()
    const app = createServer(new ModelRouter(provider, makeConfig()))

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: { question: 'What is the capital of France?' },
    })

    assert.equal(response.statusCode, 200)

    const body = response.json()
    assert.equal(body.model, 'model-a')
    assert.equal(body.strategy, 'throughput')
    assert.equal(body.content, 'response from model-a')
    assert.equal(body.attempts.length, 1)
    assert.equal(provider.calls.length, 1)
})

test('falls back to the next configured model after a provider failure', async () => {
    const provider = new FakeProvider(new Set(['model-a']))
    const app = createServer(new ModelRouter(provider, makeConfig()))

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: 'Explain transaction isolation.',
            strategy: 'latency',
        },
    })

    assert.equal(response.statusCode, 200)

    const body = response.json()
    assert.equal(body.model, 'model-b')
    assert.equal(body.strategy, 'latency')
    assert.deepEqual(body.attempts.map((attempt: { success: boolean }) => attempt.success), [false, true])
    assert.deepEqual(provider.calls.map((call) => call.model), ['model-a', 'model-b'])
})

test('returns a controlled upstream error when every model fails', async () => {
    const provider = new FakeProvider(new Set(['model-a', 'model-b', 'model-c']))
    const app = createServer(new ModelRouter(provider, makeConfig()))

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: { question: 'Explain event-driven architecture.' },
    })

    assert.equal(response.statusCode, 502)

    const body = response.json()
    assert.equal(body.error, 'All configured models failed')
    assert.equal(body.attempts.length, 3)
    assert.equal(typeof body.request_id, 'string')
})

test('rejects token requests above the configured limit', async () => {
    const provider = new FakeProvider()
    const app = createServer(new ModelRouter(provider, makeConfig()))

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: 'Explain PostgreSQL row locking.',
            max_tokens: 512,
        },
    })

    assert.equal(response.statusCode, 400)
    assert.equal(provider.calls.length, 0)
})

test('exposes routing capabilities without requiring provider access', async () => {
    const provider = new FakeProvider()
    const app = createServer(new ModelRouter(provider, makeConfig()))

    const response = await app.inject({
        method: 'GET',
        url: '/health',
    })

    assert.equal(response.statusCode, 200)

    const body = response.json()
    assert.equal(body.status, 'ok')
    assert.equal(body.routing.modelCount, 3)
    assert.deepEqual(body.routing.strategies, ['throughput', 'latency', 'price'])
})
