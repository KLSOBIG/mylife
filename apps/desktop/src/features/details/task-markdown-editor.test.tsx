import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskMarkdownEditor } from "./task-markdown-editor";

const fallbackRect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  toJSON() {
    return this;
  }
};

function latestMarkdown(handleChange: ReturnType<typeof vi.fn>) {
  return (handleChange.mock.lastCall?.[0] as string | undefined)?.trim() ?? "";
}

function selectEditorSubstring(editor: HTMLElement, start: number, end: number) {
  const textNode = editor.querySelector("p, h1, h2, h3, li, blockquote")?.firstChild;

  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    throw new Error("missing editor text node");
  }

  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(textNode, start);
  range.setEnd(textNode, end);
  selection?.removeAllRanges();
  selection?.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
}

describe("TaskMarkdownEditor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    document.elementFromPoint = vi.fn(() => null);
    Range.prototype.getBoundingClientRect = vi.fn(() => fallbackRect);
    Range.prototype.getClientRects = vi.fn(() => [fallbackRect] as unknown as DOMRectList);
    HTMLElement.prototype.getBoundingClientRect = vi.fn(() => fallbackRect);
    HTMLElement.prototype.getClientRects = vi.fn(() => [fallbackRect] as unknown as DOMRectList);
  });

  it("renders toolbar, gutter controls, and secondary markdown drawers", () => {
    const handleChange = vi.fn();

    render(
      <TaskMarkdownEditor
        documentId="task-1"
        value={"# 重构任务\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射"}
        onChange={handleChange}
      />
    );

    expect(screen.getByRole("toolbar", { name: "document-formatting-toolbar" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "文本样式" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "待办清单" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "粗体" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "插入块" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "块操作" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "预览" })).toBeInTheDocument();
    expect(screen.queryByLabelText("markdown-editor")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("markdown-preview")).not.toBeInTheDocument();
    expect(screen.getByLabelText("rich-editor")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "重构任务" })).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("applies heading and inline formatting through toolbar and emits markdown", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TaskMarkdownEditor documentId="task-format" value="Alpha" onChange={handleChange} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "文本样式" }), "heading-2");
    await waitFor(() => {
      expect(latestMarkdown(handleChange)).toMatch(/^## Alpha/);
    });

    await user.click(screen.getByRole("button", { name: "粗体" }));

    await waitFor(() => {
      expect(latestMarkdown(handleChange)).toMatch(/^## \*\*Alpha\*\*/);
    });
  });

  it("supports link editing from toolbar", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TaskMarkdownEditor documentId="task-link" value="Alpha" onChange={handleChange} />);

    selectEditorSubstring(screen.getByLabelText("rich-editor"), 2, 4);
    await user.click(screen.getByRole("button", { name: "编辑链接" }));
    await user.type(screen.getByPlaceholderText("https://example.com"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "应用链接" }));

    await waitFor(() => {
      expect(latestMarkdown(handleChange)).toContain("Al[ph](https://example.com)a");
    });
  });

  it("opens markdown and preview drawers without breaking source sync", () => {
    const handleChange = vi.fn();

    render(
      <TaskMarkdownEditor
        documentId="task-drawer"
        value={"# 重构任务\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射"}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));

    const sourceEditor = screen.getByLabelText("markdown-editor");
    expect(sourceEditor).toHaveValue("# 重构任务\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射");

    fireEvent.change(sourceEditor, {
      target: {
        value: "# 新标题"
      }
    });

    expect(handleChange).toHaveBeenCalledWith("# 新标题");

    fireEvent.click(screen.getByRole("button", { name: "预览" }));

    const preview = screen.getByLabelText("markdown-preview");
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByRole("heading", { name: "重构任务" })).toBeInTheDocument();
  });

  it("keeps task list markdown semantics", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TaskMarkdownEditor documentId="task-list" value="Todo" onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "待办清单" }));

    await waitFor(() => {
      expect(latestMarkdown(handleChange)).toContain("- [ ] Todo");
    });
  });
});
