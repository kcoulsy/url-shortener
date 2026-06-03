# URL Shortening Service

Classic system design problem, in this case I have built out a small project using SST to deploy to AWS.

Design Decisions

- stateful servers with autoscaling to avoid cold starts vs a lambda
- postgres over DynamoDB
- redis caches short URL lookups for 24 hours
- split into microservices: web, urs and analytics

Local services

```sh
docker compose up -d
```
