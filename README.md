# Smart Model Router Gateway

A small TypeScript gateway for routing LLM requests through OpenRouter with explicit model fallback, request limits and deterministic tests.

## Project background

This repository started from course material from the Software Engineering with Applied AI program published by UNIPDS and Erick Wendel.

Upstream material:
https://github.com/unipds-engenharia-de-ia-aplicada/engenharia-de-software-com-ia-aplicada

I keep that origin explicit.

The current version extends the original exercise with independently implemented routing behavior, provider abstraction, sequential model fallback, request limits, health reporting, deterministic provider-free tests and structured routing metadata.

It should be read as an extended study project with original engineering work on top of the educational base, not as a project whose entire history was created from scratch.

## Current architecture

```text
HTTP request
   |
   v
Fastify
   |
   v
ModelRouter
   |
   +--> model A
   |      |
   |      +--> success -> response
   |      |
   |      +--> failure
   |
   +--> model B
   |
   +--> model C
          |
          +--> exhausted -> controlled 502

ModelRouter
   |
   v
ModelProvider interface
   |
   v
OpenRouterService
   |
   v
OpenRouter
```

The routing layer does not depend directly on the OpenRouter SDK. Provider access sits behind a small interface, which makes fallback behavior testable without network calls or API credentials.

## Routing behavior

Models are configured as an ordered fallback chain.

For each request:

1. the request is validated;
2. the first configured model is attempted;
3. if the provider call fails, the next model is attempted;
4. the process continues until a model succeeds or the list is exhausted;
5. the response records the strategy, selected model, attempts and measured latency.

Supported provider-ordering strategies are:

- `throughput`
- `latency`
- `price`

The strategy is forwarded to OpenRouter's provider sorting configuration. It does not claim to benchmark or predict model quality locally.

## API

### Health

```http
GET /health
```

Returns the configured routing capabilities without making a model request.

### Chat

```http
POST /chat
Content-Type: application/json

{
  "question": "Explain PostgreSQL row locking.",
  "strategy": "latency",
  "max_tokens": 128
}
```

Example response shape:

```json
{
  "requestId": "request-uuid",
  "strategy": "latency",
  "model": "selected-model",
  "content": "provider response",
  "attempts": [
    {
      "model": "first-model",
      "success": false,
      "latencyMs": 120
    },
    {
      "model": "selected-model",
      "success": true,
      "latencyMs": 340
    }
  ],
  "totalLatencyMs": 462
}
```

Latency values are measured at runtime. No benchmark values are hard-coded.

## Configuration

Create a local environment file:

```bash
cp .env.example .env
```

Important settings:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
ROUTER_MODELS=model-a,model-b,model-c
ROUTER_STRATEGY=throughput
ROUTER_MAX_TOKENS=256
ROUTER_MAX_PROMPT_CHARS=8000
```

Model order is the fallback order.

## Run

Requirements:

- Node.js 24 or newer
- OpenRouter API key for real provider calls

```bash
npm ci
npm start
```

Development mode:

```bash
npm run dev
```

## Tests

```bash
npm test
```

The automated tests do not call OpenRouter and do not require an API key.

They use an in-memory fake provider to verify:

- first-model success;
- fallback after provider failure;
- exhaustion of all configured models;
- request limits;
- health capabilities.

This keeps CI deterministic and avoids consuming provider quota during normal test runs.

## Validation

```bash
npm run check
npm test
```

GitHub Actions runs both commands on pushes and pull requests.

## Current limitations

This is not presented as a complete production AI gateway.

It does not currently implement:

- authentication or tenant isolation;
- persistent quotas;
- model-quality evaluation;
- live cost accounting;
- circuit breakers;
- distributed rate limiting;
- persistent traces or metrics;
- adaptive routing from historical performance.

Those features should be added only when the project has a concrete need for them rather than as portfolio decoration.
