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
    const cluster = new sst.aws.Cluster("WebCluster", { vpc });

    const web = new sst.aws.Service("Web", {
      cluster,
      image: {
        context: "./services/web",
        dockerfile: "Dockerfile",
      },
      loadBalancer: {
        ports: [{ listen: "80/http", forward: "3000/http" }],
      },
      dev: {
        command: "pnpm dev",
        directory: "./services/web",
        url: "http://localhost:3000",
      },
    });

    return {
      web: web.url,
    };
  },
});
