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

    const editor = screen.getByLabelText("markdown-editor");
    expect(editor).toHaveValue("# 重构任务\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射");
    expect(screen.getByRole("heading", { name: "重构任务" })).toBeInTheDocument();
    expect(screen.getByText("定义 task_events 表")).toBeInTheDocument();
    expect(screen.getByLabelText("markdown-preview")).toBeInTheDocument();

    fireEvent.change(editor, {
      target: {
        value: "# 新标题"
      }
    });

    expect(handleChange).toHaveBeenCalledWith("# 新标题");
  });
});
