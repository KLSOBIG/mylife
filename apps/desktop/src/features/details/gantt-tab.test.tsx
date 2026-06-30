import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TimelineRow } from "../../lib/types";
import { GanttTab } from "./gantt-tab";

const fakeTaskWithTimeline = {
  rows: [
    {
      id: "row_1",
      title: "主任务",
      segments: [
        { id: "seg_1", status: "not_started", startAt: "2026-06-28T09:00:00.000Z", endAt: "2026-06-29T18:00:00.000Z" },
        { id: "seg_2", status: "in_progress", startAt: "2026-06-30T09:00:00.000Z", endAt: "2026-07-02T18:00:00.000Z" }
      ]
    }
  ] satisfies TimelineRow[]
};

describe("GanttTab", () => {
  it("renders status filters and timeline bars", () => {
    render(<GanttTab task={fakeTaskWithTimeline} />);
    expect(screen.getAllByText("进行中").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("gantt-row-主任务")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "甘特视图" })).toBeInTheDocument();
    expect(screen.getByText("状态时间段落座在日期轴上")).toBeInTheDocument();
    expect(screen.getByLabelText("gantt-date-axis")).toBeInTheDocument();
    expect(screen.getByText("6/30")).toBeInTheDocument();
  });
});
