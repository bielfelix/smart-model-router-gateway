# Smart Model Router Gateway

A study project for routing LLM requests through OpenRouter with Node.js, TypeScript and Fastify.

## Attribution

This repository is based on course material from the Software Engineering with Applied AI program published by UNIPDS and Erick Wendel.

Upstream material:
https://github.com/unipds-engenharia-de-ia-aplicada/engenharia-de-software-com-ia-aplicada

I keep this attribution explicit because the base architecture and exercise come from that material. This repository should be read as hands-on study and experimentation, not as an original invention of the entire project.

## What the project demonstrates

- Fastify HTTP API
- OpenRouter SDK integration
- Model configuration through environment variables
- TypeScript executed directly by modern Node.js
- Service abstraction around provider calls
- Automated tests
- Basic model-routing gateway structure

## Local setup

Create the environment file:

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm ci
```

Run the application:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Current scope

This is a learning-oriented gateway, not a production multi-provider routing platform.

A production implementation would still need stronger concerns around provider failover, policy-based routing, budgets, retries, circuit breaking, observability, authentication, quotas, rate limiting and model-evaluation data.
