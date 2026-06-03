# AWS Project

Simple SST monorepo starter with one API Gateway route backed by an AWS Lambda function.

## Structure

- `sst.config.ts` defines the AWS resources.
- `packages/functions` contains Lambda handlers.
- `packages/core` contains shared application code.

## Getting Started

```bash
pnpm install
pnpm setup
pnpm check
pnpm dev
```

To deploy:

```bash
pnpm deploy --stage dev
```

SST will print the API URL after deploy. The initial route is:

```text
GET /
```
