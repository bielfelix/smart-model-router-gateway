import { createServer } from "./server.ts";


const app = createServer()
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

console.log('test') 