import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { WidgetTask } from "../../lib/types";
import { TodayWidget } from "./today-widget";

const fakeInProgressTask: WidgetTask = {
  id: "task_1",
  title: "重构任务时间轴存储",
  status: "in_progress"
};

describe("TodayWidget", () => {
  it("renders in-progress today tasks with action buttons", () => {
    render(<TodayWidget tasks={[fakeInProgressTask]} />);
    expect(screen.getByText("今天进行中")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "搁置" })).toBeInTheDocument();
  });
});
