import { config } from "./config.ts";
import { OpenRouterService } from "./openrouterService.ts";
import { createServer } from "./server.ts";

const routerService = new OpenRouterService(config)
const app = createServer(routerService)
const host = '0.0.0.0'
const port = Number(process.env.PORT ?? 3000)

try {
  await app.listen({ port, host })
  app.log.info(`Server listening on port ${port}`)
} catch (error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'EADDRINUSE') {
    await app.listen({ port: 0, host })
    app.log.info('Server listening on a random available port')
  } else {
    throw error
  }
}
console.log(`Server listening on port ${port}`)

// console.log('test')

// await app.listen({ port: 3000, host: '0.0.0.0' })

// app.inject({
//   method: 'POST',
//   url: '/chat',
//   body: { question: 'What is the capital of France?'}
// }).then((response) => {
//   console.log('Response status: ', response.statusCode)
//   console.log('Response body: ', response.body)
// })
