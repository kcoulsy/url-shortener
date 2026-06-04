import { analyticsEvents, db } from "@aws-project/db";
import type { SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { RedirectAnalyticsEventSchema } from "./events.js";

type AnalyticsEventRow = typeof analyticsEvents.$inferInsert;

export async function processAnalyticsRecords(records: SQSRecord[]): Promise<SQSBatchResponse> {
  const failures = new Set<string>();
  const rows: AnalyticsEventRow[] = [];
  const validMessageIds: string[] = [];

  for (const record of records) {
    try {
      const parsed = RedirectAnalyticsEventSchema.safeParse(JSON.parse(record.body));
      if (!parsed.success) {
        failures.add(record.messageId);
        continue;
      }

      rows.push({
        urlId: parsed.data.urlId ? BigInt(parsed.data.urlId) : undefined,
        shortCode: parsed.data.shortCode,
        pathSegment: parsed.data.pathSegment,
        occurredAt: new Date(parsed.data.occurredAt),
        referrer: parsed.data.referrer,
        userAgent: parsed.data.userAgent,
      });
      validMessageIds.push(record.messageId);
    } catch {
      failures.add(record.messageId);
    }
  }

  if (rows.length > 0) {
    try {
      await db.insert(analyticsEvents).values(rows);
    } catch {
      for (const messageId of validMessageIds) {
        failures.add(messageId);
      }
    }
  }

  return {
    batchItemFailures: Array.from(failures, (messageId) => ({ itemIdentifier: messageId })),
  };
}

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  return processAnalyticsRecords(event.Records);
}
