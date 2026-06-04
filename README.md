# URL Shortening Service

Classic system design problem, in this case I have built out a small project using SST to deploy to AWS.

Design Decisions

- split into microservices: web, urls and analytics
- url service runs on vpc's with autoscaling to avoid cold starts vs a lambda
- postgres over DynamoDB
- redis caches short URL lookups for 24 hours
- analytics service batches events sent through SQS in a lambda as a fire and forget system
- web running on serverless using svelte with a basic UI.
- Cognito for a managed auth across the services

```sh
docker compose up -d
pnpm run dev
```
