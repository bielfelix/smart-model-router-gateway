import { config } from "./config.ts";
import { OpenRouterService } from "./openrouterService.ts";
import { createServer } from "./server.ts";

const routerService = new OpenRouterService(config)
const app = createServer(routerService)
const host = '0.0.0.0'
const port = Number(process.env.PORT ?? config.port)

try {
  await app.listen({ port, host })
} catch (error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'EADDRINUSE') {
    await app.listen({ port: 0, host })
  } else {
    throw error
  }
}

const address = app.server.address()
const boundPort = typeof address === 'object' && address ? address.port : port
app.log.info(`Server listening on port ${boundPort}`)
