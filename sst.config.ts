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
    const region = process.env.AWS_REGION || "us-east-1";
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
    const userPool = new sst.aws.CognitoUserPool("Users", {
      usernames: ["email"],
      verify: {
        emailSubject: "Verify your URL shortener account",
        emailMessage: "Your URL shortener verification code is {####}",
      },
    });
    const userPoolClient = userPool.addClient("WebClient", {
      transform: {
        client: {
          explicitAuthFlows: ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"],
          preventUserExistenceErrors: "ENABLED",
        },
      },
    });

    const urlsService = new sst.aws.Service("Urls", {
      cluster,
      link: [database, redis],
      environment: {
        COGNITO_CLIENT_ID: userPoolClient.id,
        COGNITO_REGION: region,
        COGNITO_USER_POOL_ID: userPool.id,
      },
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
        COGNITO_CLIENT_ID: userPoolClient.id,
        COGNITO_REGION: region,
        COGNITO_USER_POOL_ID: userPool.id,
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
      userPool: userPool.id,
      userPoolClient: userPoolClient.id,
      web: webService.url,
    };
  },
});
