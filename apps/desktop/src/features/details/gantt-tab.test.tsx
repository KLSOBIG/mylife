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
        { id: "seg_1", status: "not_started", width: "20%" },
        { id: "seg_2", status: "in_progress", width: "40%" }
      ]
    }
  ] satisfies TimelineRow[]
};

describe("GanttTab", () => {
  it("renders status filters and timeline bars", () => {
    render(<GanttTab task={fakeTaskWithTimeline} />);
    expect(screen.getByText("进行中")).toBeInTheDocument();
    expect(screen.getByLabelText("gantt-row-主任务")).toBeInTheDocument();
  });
});
