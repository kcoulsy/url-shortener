import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { logger } from "../utils/logger.js";

type QueueResource = {
  url: string;
};

export type RedirectAnalyticsEvent = {
  version: 1;
  type: "url.redirected";
  shortCode: string;
  pathSegment: string;
  occurredAt: string;
  urlId?: string;
  referrer?: string;
  userAgent?: string;
};

type PublishRedirectEventInput = Omit<RedirectAnalyticsEvent, "version" | "type">;

function getQueueUrl(): string | undefined {
  const linkedResource = process.env.SST_RESOURCE_AnalyticsEventsQueue;
  if (linkedResource) {
    return (JSON.parse(linkedResource) as QueueResource).url;
  }

  return process.env.ANALYTICS_QUEUE_URL;
}

function createSqsClient(): SQSClient {
  return new SQSClient({
    endpoint: process.env.SQS_ENDPOINT,
    region: process.env.AWS_REGION ?? "us-east-1",
  });
}

const sqs = createSqsClient();

export async function publishRedirectEvent(input: PublishRedirectEventInput): Promise<void> {
  const queueUrl = getQueueUrl();
  if (!queueUrl) {
    logger.debug({ shortCode: input.shortCode }, "Analytics queue is not configured");
    return;
  }

  const event: RedirectAnalyticsEvent = {
    version: 1,
    type: "url.redirected",
    ...input,
  };

  await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(event),
    }),
  );
}
