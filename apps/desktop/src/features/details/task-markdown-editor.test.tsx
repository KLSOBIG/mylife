import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskMarkdownEditor } from "./task-markdown-editor";

describe("TaskMarkdownEditor", () => {
  it("renders editable markdown input and preview", () => {
    const handleChange = vi.fn();

    render(
      <TaskMarkdownEditor
        value={"# 重构任务\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射"}
        onChange={handleChange}
      />
    );

    expect(screen.getByRole("button", { name: "文档" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "预览" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));

    const editor = screen.getByLabelText("markdown-editor");
    expect(editor).toHaveValue("# 重构任务\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射");

    fireEvent.change(editor, {
      target: {
        value: "# 新标题"
      }
    });

    expect(handleChange).toHaveBeenCalledWith("# 新标题");

    fireEvent.click(screen.getByRole("button", { name: "预览" }));

    expect(screen.queryByLabelText("markdown-editor")).not.toBeInTheDocument();
    expect(screen.getByLabelText("markdown-preview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "重构任务" })).toBeInTheDocument();
  });
});
