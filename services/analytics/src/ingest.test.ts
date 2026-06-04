import type { SQSRecord } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsEvents, db } from "@aws-project/db";
import { processAnalyticsRecords } from "./handler.js";

const dbMock = vi.hoisted(() => ({
  insert: vi.fn(),
  values: vi.fn(),
}));

vi.mock("@aws-project/db", () => ({
  analyticsEvents: { tableName: "analytics_events" },
  db: {
    insert: dbMock.insert,
  },
}));

function record(messageId: string, body: unknown): SQSRecord {
  return {
    messageId,
    receiptHandle: `${messageId}-receipt`,
    body: typeof body === "string" ? body : JSON.stringify(body),
    attributes: {
      ApproximateReceiveCount: "1",
      SentTimestamp: "0",
      SenderId: "test",
      ApproximateFirstReceiveTimestamp: "0",
    },
    messageAttributes: {},
    md5OfBody: "",
    eventSource: "aws:sqs",
    eventSourceARN: "",
    awsRegion: "us-east-1",
  };
}

const validEvent = {
  version: 1,
  type: "url.redirected",
  shortCode: "Abc1234",
  pathSegment: "docs",
  occurredAt: "2026-06-04T10:00:00.000Z",
  urlId: "42",
  referrer: "https://example.com",
  userAgent: "vitest",
} as const;

describe("analytics ingestion", () => {
  beforeEach(() => {
    dbMock.values.mockReset();
    dbMock.values.mockResolvedValue(undefined);
    dbMock.insert.mockReset();
    dbMock.insert.mockReturnValue({ values: dbMock.values });
  });

  it("batch inserts valid records", async () => {
    await expect(processAnalyticsRecords([record("1", validEvent)])).resolves.toEqual({
      batchItemFailures: [],
    });

    expect(db.insert).toHaveBeenCalledWith(analyticsEvents);
    expect(dbMock.values).toHaveBeenCalledWith([
      {
        urlId: 42n,
        shortCode: "Abc1234",
        pathSegment: "docs",
        occurredAt: new Date("2026-06-04T10:00:00.000Z"),
        referrer: "https://example.com",
        userAgent: "vitest",
      },
    ]);
  });

  it("returns partial failures for malformed records", async () => {
    await expect(
      processAnalyticsRecords([record("bad-json", "{"), record("bad-shape", {})]),
    ).resolves.toEqual({
      batchItemFailures: [{ itemIdentifier: "bad-json" }, { itemIdentifier: "bad-shape" }],
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns partial failures for records that fail DB insertion", async () => {
    dbMock.values.mockRejectedValue(new Error("db unavailable"));

    await expect(
      processAnalyticsRecords([record("1", validEvent), record("2", validEvent)]),
    ).resolves.toEqual({
      batchItemFailures: [{ itemIdentifier: "1" }, { itemIdentifier: "2" }],
    });
  });

  it("handles empty batches", async () => {
    await expect(processAnalyticsRecords([])).resolves.toEqual({
      batchItemFailures: [],
    });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
