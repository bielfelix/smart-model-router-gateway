import Fastify from 'fastify'
import { ModelRouter, RequestLimitError, RoutingExhaustedError } from './modelRouter.ts'
import { routingStrategies } from './types.ts'

export const createServer = (router: ModelRouter) => {
    const app = Fastify({ logger: true })

    app.get('/health', async () => {
        return {
            status: 'ok',
            routing: router.capabilities(),
        }
    })

    app.post('/chat', {
        schema: {
            body: {
                type: 'object',
                required: ['question'],
                additionalProperties: false,
                properties: {
                    question: { type: 'string', minLength: 5 },
                    strategy: { type: 'string', enum: routingStrategies },
                    max_tokens: { type: 'integer', minimum: 1 },
                },
            },
        },
    }, async (request, reply) => {
        const body = request.body as {
            question: string
            strategy?: typeof routingStrategies[number]
            max_tokens?: number
        }

        try {
            return await router.generate(body.question, {
                strategy: body.strategy,
                maxTokens: body.max_tokens,
            })
        } catch (error) {
            if (error instanceof RequestLimitError) {
                return reply.code(400).send({ error: error.message })
            }

            if (error instanceof RoutingExhaustedError) {
                request.log.error({
                    requestId: error.requestId,
                    attempts: error.attempts,
                }, 'All configured models failed')

                return reply.code(502).send({
                    error: 'All configured models failed',
                    request_id: error.requestId,
                    attempts: error.attempts,
                })
            }

            request.log.error({ err: error }, 'Unexpected routing error')
            return reply.code(500).send({ error: 'Unexpected routing error' })
        }
    })

    return app
}
