import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useId, useRef, useState } from "react";

type TiptapEditor = NonNullable<ReturnType<typeof useEditor>>;
type SavedSelection = { from: number; to: number };

type ButtonControl = {
  id: string;
  label: string;
  icon: string;
  disabled?: (editor: TiptapEditor) => boolean;
  active?: (editor: TiptapEditor) => boolean;
  run: (editor: TiptapEditor) => boolean;
};

type HeadingOption = {
  value: string;
  label: string;
  run: (editor: TiptapEditor) => boolean;
  active: (editor: TiptapEditor) => boolean;
};

function withExpandedTextSelection(editor: TiptapEditor) {
  const { empty, from, $from } = editor.state.selection;

  if (!empty || !$from.parent.isTextblock || $from.parent.content.size === 0) {
    return editor.chain().focus();
  }

  const start = from - $from.parentOffset;
  const end = start + $from.parent.content.size;

  return editor.chain().focus().setTextSelection({ from: start, to: end });
}

const headingOptions: HeadingOption[] = [
  {
    value: "paragraph",
    label: "正文",
    active: (editor) => !editor.isActive("heading"),
    run: (editor) => editor.chain().focus().setParagraph().run()
  },
  {
    value: "heading-1",
    label: "标题 1",
    active: (editor) => editor.isActive("heading", { level: 1 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    value: "heading-2",
    label: "标题 2",
    active: (editor) => editor.isActive("heading", { level: 2 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    value: "heading-3",
    label: "标题 3",
    active: (editor) => editor.isActive("heading", { level: 3 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
  }
];

const blockControls: ButtonControl[] = [
  {
    id: "bullet-list",
    label: "项目列表",
    icon: "•≡",
    active: (editor) => editor.isActive("bulletList"),
    run: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    id: "ordered-list",
    label: "编号列表",
    icon: "1≡",
    active: (editor) => editor.isActive("orderedList"),
    run: (editor) => editor.chain().focus().toggleOrderedList().run()
  },
  {
    id: "task-list",
    label: "待办清单",
    icon: "[]",
    active: (editor) => editor.isActive("taskList"),
    run: (editor) => editor.chain().focus().toggleTaskList().run()
  },
  {
    id: "blockquote",
    label: "引用",
    icon: "❝",
    active: (editor) => editor.isActive("blockquote"),
    run: (editor) => editor.chain().focus().toggleBlockquote().run()
  },
  {
    id: "code-block",
    label: "代码块",
    icon: "{ }",
    active: (editor) => editor.isActive("codeBlock"),
    run: (editor) => editor.chain().focus().toggleCodeBlock().run()
  }
];

const inlineControls: ButtonControl[] = [
  {
    id: "bold",
    label: "粗体",
    icon: "B",
    active: (editor) => editor.isActive("bold"),
    run: (editor) => withExpandedTextSelection(editor).toggleBold().run()
  },
  {
    id: "italic",
    label: "斜体",
    icon: "I",
    active: (editor) => editor.isActive("italic"),
    run: (editor) => withExpandedTextSelection(editor).toggleItalic().run()
  },
  {
    id: "underline",
    label: "下划线",
    icon: "U",
    active: (editor) => editor.isActive("underline"),
    run: (editor) => withExpandedTextSelection(editor).toggleUnderline().run()
  },
  {
    id: "strike",
    label: "删除线",
    icon: "S",
    active: (editor) => editor.isActive("strike"),
    run: (editor) => withExpandedTextSelection(editor).toggleStrike().run()
  },
  {
    id: "code",
    label: "行内代码",
    icon: "</>",
    active: (editor) => editor.isActive("code"),
    run: (editor) => withExpandedTextSelection(editor).toggleCode().run()
  }
];

function getActiveHeadingValue(editor: TiptapEditor) {
  return headingOptions.find((option) => option.active(editor))?.value ?? "paragraph";
}

function normalizeHref(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-z]+:\/\//i.test(trimmed) || trimmed.startsWith("mailto:")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getDomSelectionRange(editor: TiptapEditor): SavedSelection | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!editor.view.dom.contains(range.startContainer) || !editor.view.dom.contains(range.endContainer)) {
    return null;
  }

  const from = editor.view.posAtDOM(range.startContainer, range.startOffset);
  const to = editor.view.posAtDOM(range.endContainer, range.endOffset);

  return {
    from: Math.min(from, to),
    to: Math.max(from, to)
  };
}

function ToolbarButton({
  control,
  editor
}: {
  control: ButtonControl;
  editor: TiptapEditor;
}) {
  const isDisabled = control.disabled?.(editor) ?? false;
  const isActive = control.active?.(editor) ?? false;

  return (
    <button
      type="button"
      className="task-tiptap__toolbar-button task-tiptap__toolbar-button--icon"
      aria-label={control.label}
      aria-pressed={isActive}
      title={control.label}
      data-active={isActive}
      disabled={isDisabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => control.run(editor)}
    >
      <span className="task-tiptap__toolbar-button-icon" aria-hidden="true">
        {control.icon}
      </span>
    </button>
  );
}

export function TaskMarkdownEditor({
  documentId,
  value,
  onChange
}: {
  documentId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const headingSelectId = useId();
  const lastSyncedMarkdownRef = useRef(value);
  const linkMenuOpenRef = useRef(false);
  const savedSelectionRef = useRef<SavedSelection | null>(null);
  const [linkMenuOpen, setLinkMenuOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const editor = useEditor(
    {
      immediatelyRender: false,
      content: value,
      contentType: "markdown",
      editorProps: {
        attributes: {
          class: "task-tiptap__editor",
          "aria-label": "rich-editor"
        }
      },
      extensions: [
        StarterKit.configure({
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https"
          }
        }),
        TaskList,
        TaskItem.configure({
          nested: true
        }),
        Placeholder.configure({
          placeholder: "像 Notion 一样直接输入内容，[] 会同步成任务树"
        }),
        Markdown.configure({
          indentation: {
            style: "space",
            size: 2
          },
          markedOptions: {
            gfm: true,
            breaks: false
          }
        })
      ],
      onSelectionUpdate({ editor: currentEditor }) {
        const { from, to, empty } = currentEditor.state.selection;

        if (!empty) {
          savedSelectionRef.current = { from, to };
        }

        if (linkMenuOpenRef.current) {
          setLinkValue(currentEditor.getAttributes("link").href ?? "");
        }
      },
      onUpdate({ editor: currentEditor }) {
        const nextMarkdown = currentEditor.getMarkdown();
        lastSyncedMarkdownRef.current = nextMarkdown;
        onChange(nextMarkdown);
      }
    },
    [documentId]
  );

  useEffect(() => {
    linkMenuOpenRef.current = linkMenuOpen;
  }, [linkMenuOpen]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (value === lastSyncedMarkdownRef.current) {
      return;
    }

    editor.commands.setContent(value, { contentType: "markdown" });
    lastSyncedMarkdownRef.current = value;
    savedSelectionRef.current = null;
  }, [editor, value]);

  if (!editor) {
    return (
      <section className="task-markdown-editor">
        <div className="task-markdown-editor__toolbar">
          <label className="task-markdown-editor__label">任务文档</label>
        </div>
      </section>
    );
  }

  const readyEditor = editor;
  const activeHeadingValue = getActiveHeadingValue(readyEditor);
  const canUndo = readyEditor.can().chain().focus().undo().run();
  const canRedo = readyEditor.can().chain().focus().redo().run();

  function restoreSavedSelection() {
    if (!savedSelectionRef.current) {
      return readyEditor.chain().focus();
    }

    return readyEditor.chain().focus().setTextSelection(savedSelectionRef.current);
  }

  function toggleLinkMenu() {
    const nextOpen = !linkMenuOpen;

    if (nextOpen) {
      const domSelection = getDomSelectionRange(readyEditor);
      const { from, to, empty } = readyEditor.state.selection;

      if (domSelection) {
        savedSelectionRef.current = domSelection;
      } else if (!empty) {
        savedSelectionRef.current = { from, to };
      }

      setLinkValue(readyEditor.getAttributes("link").href ?? "");
    }

    setLinkMenuOpen(nextOpen);
  }

  function applyLink() {
    const href = normalizeHref(linkValue);
    const chain = restoreSavedSelection().extendMarkRange("link");

    if (!href) {
      chain.unsetLink().run();
      setLinkMenuOpen(false);
      setLinkValue("");
      return;
    }

    chain.setLink({ href }).run();
    setLinkMenuOpen(false);
  }

  function clearLink() {
    restoreSavedSelection().extendMarkRange("link").unsetLink().run();
    setLinkMenuOpen(false);
    setLinkValue("");
  }

  return (
    <section className="task-markdown-editor">
      <div className="task-markdown-editor__toolbar">
        <label className="task-markdown-editor__label">任务文档</label>
      </div>
      <div className="task-markdown-editor__rich-shell task-tiptap">
        <div className="task-tiptap__toolbar" role="toolbar" aria-label="document-formatting-toolbar">
          <div className="task-tiptap__toolbar-group">
            <button
              type="button"
              className="task-tiptap__toolbar-button task-tiptap__toolbar-button--icon"
              aria-label="撤销"
              title="撤销"
              disabled={!canUndo}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <span className="task-tiptap__toolbar-button-icon" aria-hidden="true">
                ↶
              </span>
            </button>
            <button
              type="button"
              className="task-tiptap__toolbar-button task-tiptap__toolbar-button--icon"
              aria-label="重做"
              title="重做"
              disabled={!canRedo}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <span className="task-tiptap__toolbar-button-icon" aria-hidden="true">
                ↷
              </span>
            </button>
          </div>
          <div className="task-tiptap__toolbar-separator" aria-hidden="true" />
          <div className="task-tiptap__toolbar-group">
            <label className="task-tiptap__toolbar-select-shell" htmlFor={headingSelectId}>
              <span className="task-tiptap__sr-only">文本样式</span>
              <select
                id={headingSelectId}
                className="task-tiptap__toolbar-select"
                aria-label="文本样式"
                value={activeHeadingValue}
                onChange={(event) => {
                  const option = headingOptions.find(({ value: optionValue }) => optionValue === event.target.value);
                  option?.run(editor);
                }}
              >
                {headingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {blockControls.map((control) => (
              <ToolbarButton key={control.id} control={control} editor={editor} />
            ))}
          </div>
          <div className="task-tiptap__toolbar-separator" aria-hidden="true" />
          <div className="task-tiptap__toolbar-group">
            {inlineControls.map((control) => (
              <ToolbarButton key={control.id} control={control} editor={editor} />
            ))}
            <button
              type="button"
              className="task-tiptap__toolbar-button task-tiptap__toolbar-button--icon"
              aria-label="编辑链接"
              aria-pressed={editor.isActive("link") || linkMenuOpen}
              title="编辑链接"
              data-active={editor.isActive("link") || linkMenuOpen}
              onMouseDown={(event) => event.preventDefault()}
              onClick={toggleLinkMenu}
            >
              <span className="task-tiptap__toolbar-button-icon" aria-hidden="true">
                🔗
              </span>
            </button>
            <button
              type="button"
              className="task-tiptap__toolbar-button"
              aria-label="清除格式"
              title="清除格式"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            >
              清除
            </button>
          </div>
        </div>
        {linkMenuOpen ? (
          <div className="task-tiptap__link-editor" role="group" aria-label="link-editor">
            <input
              type="url"
              value={linkValue}
              placeholder="https://example.com"
              aria-label="链接地址"
              onChange={(event) => setLinkValue(event.target.value)}
            />
            <button type="button" className="task-tiptap__link-button" onMouseDown={(event) => event.preventDefault()} onClick={applyLink}>
              应用链接
            </button>
            <button
              type="button"
              className="task-tiptap__link-button task-tiptap__link-button--ghost"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearLink}
            >
              移除链接
            </button>
          </div>
        ) : null}
        <EditorContent editor={editor} className="task-tiptap__content" />
      </div>
    </section>
  );
}
