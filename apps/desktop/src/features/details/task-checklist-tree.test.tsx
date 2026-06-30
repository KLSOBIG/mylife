import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskChecklistTree } from "./task-checklist-tree";

describe("TaskChecklistTree", () => {
  it("extracts markdown checkboxes into nested tree rows", () => {
    render(
      <TaskChecklistTree
        markdown={[
          "# 详情",
          "- [ ] 顶层任务",
          "  - [x] 已完成子任务",
          "  - [ ] 进行中子任务"
        ].join("\n")}
      />
    );

    expect(screen.getByRole("tree", { name: "markdown-checklist-tree" })).toBeInTheDocument();
    expect(screen.getByText("顶层任务")).toBeInTheDocument();
    expect(screen.getByText("已完成子任务")).toBeInTheDocument();
    expect(screen.getByText("进行中子任务")).toBeInTheDocument();
    expect(screen.getByText("已完成")).toBeInTheDocument();
    expect(screen.getAllByText("未完成")).toHaveLength(2);
  });
});
