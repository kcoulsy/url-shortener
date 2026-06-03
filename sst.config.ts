/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "aws-project",
      home: "aws",
      providers: {
        aws: {
          region: process.env.AWS_REGION || "us-east-1",
        },
      },
      removal: input?.stage === "production" ? "retain" : "remove",
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("ShorteningVPC");
    const database = new sst.aws.Postgres("ShorteningPostgres", {
      vpc,
      database: "shortener",
      dev: {
        host: "localhost",
        port: 5432,
        username: "postgres",
        password: "password",
        database: "shortener",
      },
    });
    const redis = new sst.aws.Redis("ShorteningRedis", {
      vpc,
      cluster: false,
      dev: {
        host: "localhost",
        port: 6379,
      },
    });
    const cluster = new sst.aws.Cluster("UrlsCluster", { vpc });

    const urlsService = new sst.aws.Service("Urls", {
      cluster,
      link: [database, redis],
      image: {
        context: "./services/urls",
        dockerfile: "Dockerfile",
      },
      loadBalancer: {
        ports: [{ listen: "80/http", forward: "3000/http" }],
      },
      dev: {
        command: "pnpm dev",
        directory: "./services/urls",
        url: "http://localhost:3000",
      },
    });

    const webService = new sst.aws.SvelteKit("Web", {
      path: "services/web",
      link: [urlsService],
      environment: {
        PUBLIC_URLS_URL: urlsService.url,
      },
      buildCommand: "pnpm build",
      dev: {
        command: "pnpm dev --host 0.0.0.0",
        directory: "./services/web",
        url: "http://localhost:5173",
      },
    });

    return {
      urls: urlsService.url,
      database: database.host,
      redis: redis.host,
      web: webService.url,
    };
  },
});
