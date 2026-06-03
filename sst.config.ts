/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "aws-project",
      home: "aws",
      providers: {
        aws: {
          region: process.env.AWS_REGION || "us-east-1"
        }
      },
      removal: input?.stage === "production" ? "retain" : "remove"
    };
  },
  async run() {
    const api = new sst.aws.ApiGatewayV2("Api");

    api.route("GET /", "packages/functions/src/hello.handler");

    return {
      api: api.url
    };
  }
});
