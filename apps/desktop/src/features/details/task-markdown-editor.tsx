import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useId, useRef, useState } from "react";
import { parseMarkdownBlocks } from "./markdown-helpers";

type TiptapEditor = NonNullable<ReturnType<typeof useEditor>>;
type SavedSelection = { from: number; to: number };
type EditorRange = { from: number; to: number };

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

type CommandDefinition = {
  id: string;
  label: string;
  hint: string;
  aliases: string[];
  run: (editor: TiptapEditor, range?: EditorRange) => void;
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

const blockMenuCommands: CommandDefinition[] = [
  {
    id: "text",
    label: "文本",
    hint: "普通段落",
    aliases: ["paragraph", "text", "body"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.setParagraph().run();
    }
  },
  {
    id: "heading-1",
    label: "Heading 1",
    hint: "页面标题",
    aliases: ["title", "heading", "h1"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.setHeading({ level: 1 }).run();
    }
  },
  {
    id: "heading-2",
    label: "Heading 2",
    hint: "章节标题",
    aliases: ["heading", "h2", "section"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.setHeading({ level: 2 }).run();
    }
  },
  {
    id: "heading-3",
    label: "Heading 3",
    hint: "小节标题",
    aliases: ["heading", "h3", "subsection"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.setHeading({ level: 3 }).run();
    }
  },
  {
    id: "bullet-list",
    label: "Bulleted list",
    hint: "无序列表",
    aliases: ["list", "bullet", "ul"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.toggleBulletList().run();
    }
  },
  {
    id: "ordered-list",
    label: "Numbered list",
    hint: "有序列表",
    aliases: ["list", "ordered", "ol", "number"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.toggleOrderedList().run();
    }
  },
  {
    id: "task-list",
    label: "To-do list",
    hint: "任务清单",
    aliases: ["todo", "task", "checkbox", "checklist"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.toggleTaskList().run();
    }
  },
  {
    id: "blockquote",
    label: "Quote",
    hint: "引用块",
    aliases: ["quote", "blockquote", "callout"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.toggleBlockquote().run();
    }
  },
  {
    id: "code-block",
    label: "Code",
    hint: "代码块",
    aliases: ["code", "snippet", "pre"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.toggleCodeBlock().run();
    }
  },
  {
    id: "divider",
    label: "Divider",
    hint: "分隔线",
    aliases: ["divider", "rule", "hr"],
    run(editor, range) {
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain.setHorizontalRule().run();
    }
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

function matchesCommand(command: CommandDefinition, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();
  return (
    command.label.toLowerCase().includes(normalized) ||
    command.hint.toLowerCase().includes(normalized) ||
    command.aliases.some((alias) => alias.includes(normalized))
  );
}

function getActiveBlockTop(editor: TiptapEditor, container: HTMLDivElement | null) {
  if (!container) {
    return 72;
  }

  const domAtPos = editor.view.domAtPos(editor.state.selection.from);
  const node = domAtPos.node.nodeType === Node.TEXT_NODE ? domAtPos.node.parentElement : (domAtPos.node as HTMLElement | null);
  const block = node?.closest("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre");

  if (!block) {
    return 72;
  }

  const containerRect = container.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  return Math.max(64, blockRect.top - containerRect.top + container.scrollTop - 4);
}

function getSlashState(editor: TiptapEditor, container: HTMLDivElement | null) {
  const { selection } = editor.state;

  if (!selection.empty) {
    return null;
  }

  const parentText = selection.$from.parent.textContent ?? "";
  const offset = selection.$from.parentOffset;
  const textBeforeCursor = parentText.slice(0, offset);
  const match = textBeforeCursor.match(/^\/([^\s]*)$/);

  if (!match) {
    return null;
  }

  const coords = editor.view.coordsAtPos(selection.from);
  const containerRect = container?.getBoundingClientRect();

  return {
    query: match[1].toLowerCase(),
    range: {
      from: selection.$from.start(),
      to: selection.$from.start() + textBeforeCursor.length
    },
    top: coords.bottom - (containerRect?.top ?? 0) + (container?.scrollTop ?? 0) + 10
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const blockMenuRef = useRef<HTMLDivElement>(null);

  const [linkMenuOpen, setLinkMenuOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [gutterTop, setGutterTop] = useState(72);
  const [slashMenu, setSlashMenu] = useState<{
    query: string;
    range: EditorRange;
    top: number;
  } | null>(null);

  const blocks = parseMarkdownBlocks(value);

  function syncFloatingUi(currentEditor: TiptapEditor) {
    setGutterTop(getActiveBlockTop(currentEditor, canvasRef.current));
    setSlashMenu(getSlashState(currentEditor, canvasRef.current));
  }

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
          heading: {
            levels: [1, 2, 3]
          },
          link: false,
          underline: false
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https"
        }),
        Underline,
        TaskList,
        TaskItem.configure({
          nested: true
        }),
        Placeholder.configure({
          placeholder: "输入 '/' 打开命令，继续用 Markdown 存储。"
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
      onCreate({ editor: currentEditor }) {
        syncFloatingUi(currentEditor);
      },
      onFocus({ editor: currentEditor }) {
        syncFloatingUi(currentEditor);
      },
      onSelectionUpdate({ editor: currentEditor }) {
        const { from, to, empty } = currentEditor.state.selection;

        if (!empty) {
          savedSelectionRef.current = { from, to };
        }

        if (linkMenuOpenRef.current) {
          setLinkValue(currentEditor.getAttributes("link").href ?? "");
        }

        syncFloatingUi(currentEditor);
      },
      onTransaction({ editor: currentEditor }) {
        syncFloatingUi(currentEditor);
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
    setShowMarkdown(false);
    setShowPreview(false);
    setInsertMenuOpen(false);
    setBlockMenuOpen(false);
    setSlashMenu(null);
  }, [documentId]);

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
    syncFloatingUi(editor);
  }, [editor, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const keepOpen =
        insertMenuRef.current?.contains(target) ||
        blockMenuRef.current?.contains(target) ||
        (target instanceof HTMLElement &&
          Boolean(
            target.closest(".task-markdown-editor__gutter-button") ||
              target.closest(".task-tiptap__link-editor") ||
              target.closest(".task-tiptap__toolbar-button")
          ));

      if (!keepOpen) {
        setInsertMenuOpen(false);
        setBlockMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setInsertMenuOpen(false);
      setBlockMenuOpen(false);
      setSlashMenu(null);
      setLinkMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!editor || !canvasRef.current) {
      return;
    }

    const container = canvasRef.current;
    const handleScroll = () => syncFloatingUi(editor);
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [editor]);

  if (!editor) {
    return <section className="task-markdown-editor" />;
  }

  const readyEditor = editor;
  const activeHeadingValue = getActiveHeadingValue(readyEditor);
  const canUndo = readyEditor.can().chain().focus().undo().run();
  const canRedo = readyEditor.can().chain().focus().redo().run();
  const visibleSlashCommands = slashMenu
    ? blockMenuCommands.filter((command) => matchesCommand(command, slashMenu.query)).slice(0, 7)
    : [];

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

  function runCommand(command: CommandDefinition, range?: EditorRange) {
    command.run(readyEditor, range);
    setInsertMenuOpen(false);
    setBlockMenuOpen(false);
    setSlashMenu(null);
    syncFloatingUi(readyEditor);
  }

  function toggleInspector(panel: "markdown" | "preview") {
    if (panel === "markdown") {
      setShowMarkdown((current) => !current);
      return;
    }

    setShowPreview((current) => !current);
  }

  return (
    <section className="task-markdown-editor">
      <div className="task-markdown-editor__canvas" ref={canvasRef}>
        <div className="task-markdown-editor__gutter" style={{ top: `${gutterTop}px` }}>
          <button
            type="button"
            aria-label="插入块"
            className="task-markdown-editor__gutter-button"
            onClick={() => {
              setInsertMenuOpen((current) => !current);
              setBlockMenuOpen(false);
            }}
          >
            +
          </button>
          <button
            type="button"
            aria-label="块操作"
            className="task-markdown-editor__gutter-button"
            onClick={() => {
              setBlockMenuOpen((current) => !current);
              setInsertMenuOpen(false);
            }}
          >
            ⋮⋮
          </button>
        </div>

        {insertMenuOpen ? (
          <div className="task-markdown-editor__menu-popover" ref={insertMenuRef} style={{ top: `${gutterTop}px` }}>
            {blockMenuCommands.map((command) => (
              <button
                key={command.id}
                type="button"
                className="task-markdown-editor__menu-item"
                onClick={() => runCommand(command)}
              >
                <span>{command.label}</span>
                <small>{command.hint}</small>
              </button>
            ))}
          </div>
        ) : null}

        {blockMenuOpen ? (
          <div className="task-markdown-editor__menu-popover" ref={blockMenuRef} style={{ top: `${gutterTop}px` }}>
            {blockMenuCommands.map((command) => (
              <button
                key={command.id}
                type="button"
                className="task-markdown-editor__menu-item"
                onClick={() => runCommand(command)}
              >
                <span>{command.label}</span>
                <small>{command.hint}</small>
              </button>
            ))}
          </div>
        ) : null}

        <div className="task-markdown-editor__rich-shell task-tiptap">
          <div className="task-tiptap__toolbar" role="toolbar" aria-label="document-formatting-toolbar">
            <div className="task-tiptap__toolbar-group">
              <button
                type="button"
                className="task-tiptap__toolbar-button task-tiptap__toolbar-button--icon"
                aria-label="撤销编辑"
                title="撤销编辑"
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
                aria-label="重做编辑"
                title="重做编辑"
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
            <div className="task-tiptap__toolbar-spacer" aria-hidden="true" />
            <div className="task-tiptap__toolbar-group task-tiptap__toolbar-group--secondary">
              <button
                type="button"
                className={showMarkdown ? "task-tiptap__toolbar-button is-active" : "task-tiptap__toolbar-button"}
                aria-label="Markdown"
                data-active={showMarkdown}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleInspector("markdown")}
              >
                Markdown
              </button>
              <button
                type="button"
                className={showPreview ? "task-tiptap__toolbar-button is-active" : "task-tiptap__toolbar-button"}
                aria-label="预览"
                data-active={showPreview}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleInspector("preview")}
              >
                预览
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

          <div className="task-markdown-editor__editor-stage">
            <BubbleMenu editor={editor} className="task-tiptap__menu task-tiptap__menu--bubble">
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}>
                B
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}>
                I
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} data-active={editor.isActive("underline")}>
                U
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} data-active={editor.isActive("strike")}>
                S
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} data-active={editor.isActive("code")}>
                Code
              </button>
            </BubbleMenu>

            <EditorContent editor={editor} className="task-tiptap__content" />

            {slashMenu && visibleSlashCommands.length > 0 ? (
              <div className="task-markdown-editor__slash-menu" style={{ top: `${slashMenu.top}px` }}>
                {visibleSlashCommands.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    className="task-markdown-editor__menu-item"
                    onClick={() => runCommand(command, slashMenu.range)}
                  >
                    <span>{command.label}</span>
                    <small>{command.hint}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showMarkdown || showPreview ? (
        <div className="task-markdown-editor__drawer-strip">
          {showMarkdown ? (
            <section className="task-markdown-editor__drawer" aria-label="markdown-panel">
              <div className="task-markdown-editor__drawer-header">
                <span>Markdown</span>
                <small>编辑源码</small>
              </div>
              <textarea
                aria-label="markdown-editor"
                className="task-markdown-editor__textarea"
                value={value}
                onChange={(event) => onChange(event.target.value)}
              />
            </section>
          ) : null}

          {showPreview ? (
            <section aria-label="markdown-preview" className="task-markdown-editor__drawer task-markdown-editor__preview">
              <div className="task-markdown-editor__drawer-header">
                <span>Preview</span>
                <small>当前渲染</small>
              </div>
              <div className="task-markdown-editor__preview-body">
                {blocks.map((block, index) => {
                  if (block.type === "heading") {
                    if (block.depth === 1) {
                      return <h1 key={index}>{block.text}</h1>;
                    }

                    if (block.depth === 2) {
                      return <h2 key={index}>{block.text}</h2>;
                    }

                    return <h3 key={index}>{block.text}</h3>;
                  }

                  if (block.type === "checklist") {
                    return (
                      <div key={index} className="task-markdown-editor__check-row">
                        <input type="checkbox" checked={block.checked} readOnly aria-hidden="true" />
                        <span>{block.text}</span>
                      </div>
                    );
                  }

                  return <p key={index}>{block.text}</p>;
                })}
                {blocks.length === 0 ? <div>暂无内容</div> : null}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
