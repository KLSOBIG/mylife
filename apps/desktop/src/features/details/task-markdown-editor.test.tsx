import { render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByRole("combobox", { name: "文本样式" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "待办清单" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "粗体" })).toBeInTheDocument();
    expect(screen.getByLabelText("rich-editor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Markdown" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "预览" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "重构任务" })).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("renders component-style toolbar controls for required formatting actions", () => {
    render(<TaskMarkdownEditor documentId="task-toolbar" value="" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "撤销" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重做" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "文本样式" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "项目列表" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编号列表" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "待办清单" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "引用" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "代码块" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "行内代码" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑链接" })).toBeInTheDocument();
  });

  it("applies heading and inline formatting through toolbar and emits markdown only", async () => {
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

    expect(screen.queryByText("```")).not.toBeInTheDocument();
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

  it("keeps task list markdown semantics", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TaskMarkdownEditor documentId="task-list" value="Todo" onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "待办清单" }));

    await waitFor(() => {
      expect(latestMarkdown(handleChange)).toContain("- [ ] Todo");
    });
  });

  it("emits markdown for ordered list", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TaskMarkdownEditor documentId="task-ordered" value="Alpha" onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "编号列表" }));
    await waitFor(() => {
      expect(latestMarkdown(handleChange)).toContain("1. Alpha");
    });
  });

  it("emits markdown for code block", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TaskMarkdownEditor documentId="task-code" value="Code" onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "代码块" }));
    await waitFor(() => {
      expect(latestMarkdown(handleChange)).toContain("```");
    });
  });

  it("emits markdown for underline formatting", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TaskMarkdownEditor documentId="task-underline" value="Line" onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "下划线" }));
    await waitFor(() => {
      expect(latestMarkdown(handleChange)).toContain("++Line++");
    });
  });
});
