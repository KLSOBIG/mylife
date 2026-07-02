import { describe, expect, it } from "vitest";
import { applyStatus, seedTasks } from "./task-state";

describe("task-state timeline transitions", () => {
  it("keeps status transitions on logical task timeline instead of wall clock date", () => {
    const task = seedTasks()[0];

    const next = applyStatus(task, "completed");
    const segments = next.timeline[0].segments;
    const lastSegment = segments[segments.length - 1];
    const previousSegment = segments[segments.length - 2];

    expect(previousSegment.endAt).toBe("2026-06-30T09:30:00.000Z");
    expect(lastSegment.startAt).toBe("2026-06-30T09:30:00.000Z");
    expect(lastSegment.endAt).toBe("2026-06-30T09:30:00.000Z");
  });
});
