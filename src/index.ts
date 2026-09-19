import { config } from './config.ts'
import { ModelRouter } from './modelRouter.ts'
import { OpenRouterService } from './openrouterService.ts'
import { createServer } from './server.ts'

const provider = new OpenRouterService(config)
const router = new ModelRouter(provider, config)
const app = createServer(router)

const host = '0.0.0.0'
const port = config.port

await app.listen({ port, host })
app.log.info({ port }, 'Smart Model Router Gateway started')
