import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import { parseMarkdownBlocks } from "./markdown-helpers";

const viewModes = [
  { id: "document", label: "文档" },
  { id: "markdown", label: "Markdown" },
  { id: "preview", label: "预览" }
] as const;

export function TaskMarkdownEditor({
  documentId,
  value,
  onChange
}: {
  documentId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"document" | "markdown" | "preview">("document");
  const lastSyncedMarkdownRef = useRef(value);
  const blocks = parseMarkdownBlocks(value);
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
          codeBlock: false
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
      onUpdate({ editor: currentEditor }) {
        const nextMarkdown = currentEditor.getMarkdown();
        lastSyncedMarkdownRef.current = nextMarkdown;
        onChange(nextMarkdown);
      }
    },
    [documentId]
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (value === lastSyncedMarkdownRef.current) {
      return;
    }

    editor.commands.setContent(value, { contentType: "markdown" });
    lastSyncedMarkdownRef.current = value;
  }, [editor, value]);

  return (
    <section className="task-markdown-editor" data-view-mode={viewMode}>
      <div className="task-markdown-editor__toolbar">
        <label className="task-markdown-editor__label">
          任务文档
        </label>
        <div className="task-markdown-editor__mode-switch" role="group" aria-label="markdown-view-mode">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              aria-pressed={viewMode === mode.id}
              className={viewMode === mode.id ? "task-markdown-editor__mode-button is-active" : "task-markdown-editor__mode-button"}
              onClick={() => setViewMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "document" ? (
        <div className="task-markdown-editor__rich-shell task-tiptap">
          {editor ? (
            <>
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
                  链接
                </button>
              </BubbleMenu>
              <FloatingMenu editor={editor} className="task-tiptap__menu task-tiptap__menu--floating">
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                  H2
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>
                  列表
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()}>
                  待办
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                  引用
                </button>
              </FloatingMenu>
              <EditorContent editor={editor} className="task-tiptap__content" />
            </>
          ) : null}
        </div>
      ) : null}

      {viewMode === "markdown" ? (
        <div className="task-markdown-editor__input">
          <textarea
            aria-label="markdown-editor"
            className="task-markdown-editor__textarea"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      ) : null}

      {viewMode === "preview" ? (
        <section aria-label="markdown-preview" className="task-markdown-editor__preview">
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
        </section>
      ) : null}
    </section>
  );
}
