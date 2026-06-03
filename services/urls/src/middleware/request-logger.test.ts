import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestLogger } from "./request-logger.js";
import { logger } from "../utils/logger.js";

describe("requestLogger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  it("logs completed requests", async () => {
    const infoSpy = vi.spyOn(logger, "info");
    const context = {
      req: {
        method: "GET",
        path: "/health",
      },
      res: {
        status: 200,
      },
    };

    await requestLogger(context as never, async () => {});

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        path: "/health",
        status: 200,
        durationMs: expect.any(Number),
      }),
      "Request completed",
    );
  });

  it("logs and rethrows request failures", async () => {
    const error = new Error("boom");
    const errorSpy = vi.spyOn(logger, "error");
    const context = {
      req: {
        method: "GET",
        path: "/fail",
      },
    };

    await expect(
      requestLogger(context as never, async () => {
        throw error;
      }),
    ).rejects.toThrow(error);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error,
        method: "GET",
        path: "/fail",
        durationMs: expect.any(Number),
      }),
      "Request failed",
    );
  });
});
