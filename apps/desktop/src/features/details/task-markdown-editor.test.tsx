import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskMarkdownEditor } from "./task-markdown-editor";

describe("TaskMarkdownEditor", () => {
  it("keeps the document editor primary while exposing markdown and preview as secondary panels", () => {
    const handleChange = vi.fn();

    render(
      <TaskMarkdownEditor
        documentId="task-1"
        value={"# 重构任务\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射"}
        onChange={handleChange}
      />
    );

    expect(screen.getByLabelText("rich-editor")).toBeInTheDocument();
    expect(screen.queryByLabelText("markdown-editor")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("markdown-preview")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "插入块" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "块操作" })).toBeInTheDocument();
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

    expect(screen.getByLabelText("markdown-editor")).toBeInTheDocument();
    const preview = screen.getByLabelText("markdown-preview");
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByRole("heading", { name: "重构任务" })).toBeInTheDocument();
  });
});
