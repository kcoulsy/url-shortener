import {
  DeleteMessageBatchCommand,
  type Message,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import type { SQSRecord } from "aws-lambda";
import { processAnalyticsRecords } from "./handler.js";

const queueUrl = process.env.ANALYTICS_QUEUE_URL;

if (!queueUrl) {
  throw new Error("ANALYTICS_QUEUE_URL is required for the analytics local worker.");
}

const sqs = new SQSClient({
  endpoint: process.env.SQS_ENDPOINT,
  region: process.env.AWS_REGION ?? "us-east-1",
});

function toSqsRecord(message: Message): SQSRecord {
  return {
    messageId: message.MessageId ?? "",
    receiptHandle: message.ReceiptHandle ?? "",
    body: message.Body ?? "",
    attributes: {
      ApproximateReceiveCount: "1",
      SentTimestamp: Date.now().toString(),
      SenderId: "localstack",
      ApproximateFirstReceiveTimestamp: Date.now().toString(),
    },
    messageAttributes: {},
    md5OfBody: message.MD5OfBody ?? "",
    eventSource: "aws:sqs",
    eventSourceARN: "",
    awsRegion: process.env.AWS_REGION ?? "us-east-1",
  };
}

async function poll(): Promise<void> {
  const response = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 5,
    }),
  );
  const messages = response.Messages ?? [];
  if (messages.length === 0) {
    return;
  }

  const records = messages.map(toSqsRecord);
  const result = await processAnalyticsRecords(records);
  const failedIds = new Set(result.batchItemFailures.map((failure) => failure.itemIdentifier));
  const successfulMessages = messages.filter((message) => !failedIds.has(message.MessageId ?? ""));

  if (successfulMessages.length > 0) {
    await sqs.send(
      new DeleteMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: successfulMessages.map((message) => ({
          Id: message.MessageId,
          ReceiptHandle: message.ReceiptHandle,
        })),
      }),
    );
  }
}

while (true) {
  await poll();
}
