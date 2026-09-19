import Fastify from "fastify";
import { OpenRouterService } from "./openrouterService.ts";

export const createServer = (routerService: OpenRouterService) => {
    const app = Fastify({ logger: true })

    app.post('/chat', {
        schema: {
            body: {
                type: 'object',
                required: ['question'],
                properties: {
                    question: { type: 'string', minLength: 5 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { question } = request.body as { question: string }
            return await routerService.generate(question)
        } catch (error) {
            request.log.error({ err: error }, 'OpenRouter request failed')
            return reply.code(502).send({ error: 'Upstream model request failed' })
        }
    })

    return app
}
