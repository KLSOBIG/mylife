import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import { parseMarkdownBlocks } from "./markdown-helpers";

type EditorRange = {
  from: number;
  to: number;
};

type CommandDefinition = {
  id: string;
  label: string;
  hint: string;
  aliases: string[];
  run: (editor: Editor, range?: EditorRange) => void;
};

const commandDefinitions: CommandDefinition[] = [
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

function getActiveBlockTop(editor: Editor, container: HTMLDivElement | null) {
  if (!container) {
    return 56;
  }

  const domAtPos = editor.view.domAtPos(editor.state.selection.from);
  const node = domAtPos.node.nodeType === Node.TEXT_NODE ? domAtPos.node.parentElement : (domAtPos.node as HTMLElement | null);
  const block = node?.closest("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre");

  if (!block) {
    return 56;
  }

  const containerRect = container.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  return Math.max(40, blockRect.top - containerRect.top + container.scrollTop - 4);
}

function getSlashState(editor: Editor, container: HTMLDivElement | null) {
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

export function TaskMarkdownEditor({
  documentId,
  value,
  onChange
}: {
  documentId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [gutterTop, setGutterTop] = useState(56);
  const [slashMenu, setSlashMenu] = useState<{
    query: string;
    range: EditorRange;
    top: number;
  } | null>(null);
  const lastSyncedMarkdownRef = useRef(value);
  const canvasRef = useRef<HTMLDivElement>(null);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const blockMenuRef = useRef<HTMLDivElement>(null);
  const blocks = parseMarkdownBlocks(value);

  function syncFloatingUi(currentEditor: Editor) {
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
          autolink: false,
          openOnClick: false
        }),
        Underline,
        TaskList,
        TaskItem.configure({
          nested: true
        }),
        Placeholder.configure({
          placeholder: "Type '/' for commands, keep writing in Markdown."
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
    syncFloatingUi(editor);
  }, [editor, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const isMenuTarget =
        insertMenuRef.current?.contains(target) ||
        blockMenuRef.current?.contains(target) ||
        (target instanceof HTMLElement && Boolean(target.closest(".task-markdown-editor__gutter-button")));

      if (!isMenuTarget) {
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

  function runCommand(command: CommandDefinition, range?: EditorRange) {
    if (!editor) {
      return;
    }

    command.run(editor, range);
    setInsertMenuOpen(false);
    setBlockMenuOpen(false);
    setSlashMenu(null);
    syncFloatingUi(editor);
  }

  function toggleInspector(panel: "markdown" | "preview") {
    if (panel === "markdown") {
      setShowMarkdown((current) => !current);
      return;
    }

    setShowPreview((current) => !current);
  }

  const visibleSlashCommands = slashMenu
    ? commandDefinitions.filter((command) => matchesCommand(command, slashMenu.query)).slice(0, 7)
    : [];

  return (
    <section className="task-markdown-editor">
      <div className="task-markdown-editor__chrome">
        <div className="task-markdown-editor__page-meta">
          <span className="task-markdown-editor__page-label">Document</span>
          <span className="task-markdown-editor__page-hint">Markdown-backed editor</span>
        </div>
        <div className="task-markdown-editor__chrome-actions">
          <button
            type="button"
            className={showMarkdown ? "task-markdown-editor__chrome-button is-active" : "task-markdown-editor__chrome-button"}
            onClick={() => toggleInspector("markdown")}
          >
            Markdown
          </button>
          <button
            type="button"
            className={showPreview ? "task-markdown-editor__chrome-button is-active" : "task-markdown-editor__chrome-button"}
            onClick={() => toggleInspector("preview")}
          >
            预览
          </button>
          <button
            type="button"
            className="task-markdown-editor__chrome-button"
            onClick={() => editor?.chain().focus().undo().run()}
          >
            Undo
          </button>
          <button
            type="button"
            className="task-markdown-editor__chrome-button"
            onClick={() => editor?.chain().focus().redo().run()}
          >
            Redo
          </button>
        </div>
      </div>

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
            ::
          </button>
        </div>

        {insertMenuOpen ? (
          <div className="task-markdown-editor__menu-popover" ref={insertMenuRef} style={{ top: `${gutterTop}px` }}>
            <div className="task-markdown-editor__menu-header">Insert</div>
            {commandDefinitions.map((command) => (
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
            <div className="task-markdown-editor__menu-header">Turn into</div>
            {commandDefinitions.map((command) => (
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

        <div className="task-markdown-editor__page">
          {editor ? (
            <>
              <BubbleMenu editor={editor} className="task-tiptap__menu task-tiptap__menu--bubble">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}>
                  B
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}>
                  I
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  data-active={editor.isActive("underline")}
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  data-active={editor.isActive("strike")}
                >
                  S
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} data-active={editor.isActive("code")}>
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const previous = editor.getAttributes("link").href ?? "";
                    const href = window.prompt("输入链接", previous);
                    if (href === null) {
                      return;
                    }
                    if (!href.trim()) {
                      editor.chain().focus().unsetLink().run();
                      return;
                    }
                    editor.chain().focus().setLink({ href }).run();
                  }}
                  data-active={editor.isActive("link")}
                >
                  Link
                </button>
              </BubbleMenu>
              <EditorContent editor={editor} className="task-tiptap__content" />
            </>
          ) : null}

          {slashMenu && visibleSlashCommands.length > 0 ? (
            <div className="task-markdown-editor__slash-menu" style={{ top: `${slashMenu.top}px` }}>
              <div className="task-markdown-editor__menu-header">Basic blocks</div>
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

      {showMarkdown || showPreview ? (
        <div className="task-markdown-editor__drawer-strip">
          {showMarkdown ? (
            <section className="task-markdown-editor__drawer" aria-label="markdown-panel">
              <div className="task-markdown-editor__drawer-header">
                <span>Markdown</span>
                <small>Raw source stays canonical</small>
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
                <small>Rendered from current markdown</small>
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
