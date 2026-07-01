import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskMarkdownEditor } from "./task-markdown-editor";

describe("TaskMarkdownEditor", () => {
  it("renders one editor surface and no markdown mode switcher", () => {
    const handleChange = vi.fn();

    render(
      <TaskMarkdownEditor
        documentId="task-1"
        value={"# 重构任务\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射"}
        onChange={handleChange}
      />
    );

    expect(screen.getByRole("toolbar", { name: "document-formatting-toolbar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "标题 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "待办清单" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "粗体" })).toBeInTheDocument();
    expect(screen.getByLabelText("rich-editor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Markdown" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "预览" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "重构任务" })).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
