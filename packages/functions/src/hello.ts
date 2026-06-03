import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { greeting } from "@aws-project/core/greeting";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      message: greeting()
    })
  };
};
