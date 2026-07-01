import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
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

type TiptapEditor = NonNullable<ReturnType<typeof useEditor>>;

type ToolbarControl = {
  id: string;
  label: string;
  short?: string;
  active: (editor: TiptapEditor) => boolean;
  run: (editor: TiptapEditor) => boolean;
};

const documentControls: ToolbarControl[] = [
  {
    id: "paragraph",
    label: "正文",
    active: (editor) => !editor.isActive("heading") && !editor.isActive("blockquote"),
    run: (editor) => editor.chain().focus().setParagraph().run()
  },
  {
    id: "heading-1",
    label: "标题 1",
    short: "H1",
    active: (editor) => editor.isActive("heading", { level: 1 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    id: "heading-2",
    label: "标题 2",
    short: "H2",
    active: (editor) => editor.isActive("heading", { level: 2 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    id: "heading-3",
    label: "标题 3",
    short: "H3",
    active: (editor) => editor.isActive("heading", { level: 3 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    id: "bullet-list",
    label: "项目列表",
    short: "• 列表",
    active: (editor) => editor.isActive("bulletList"),
    run: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    id: "task-list",
    label: "待办清单",
    short: "[] 待办",
    active: (editor) => editor.isActive("taskList"),
    run: (editor) => editor.chain().focus().toggleTaskList().run()
  },
  {
    id: "blockquote",
    label: "引用",
    short: "引用",
    active: (editor) => editor.isActive("blockquote"),
    run: (editor) => editor.chain().focus().toggleBlockquote().run()
  }
] as const;

const inlineControls: ToolbarControl[] = [
  {
    id: "bold",
    label: "粗体",
    short: "B",
    active: (editor) => editor.isActive("bold"),
    run: (editor) => editor.chain().focus().toggleBold().run()
  },
  {
    id: "italic",
    label: "斜体",
    short: "I",
    active: (editor) => editor.isActive("italic"),
    run: (editor) => editor.chain().focus().toggleItalic().run()
  },
  {
    id: "underline",
    label: "下划线",
    short: "U",
    active: (editor) => editor.isActive("underline"),
    run: (editor) => editor.chain().focus().toggleUnderline().run()
  },
  {
    id: "strike",
    label: "删除线",
    short: "S",
    active: (editor) => editor.isActive("strike"),
    run: (editor) => editor.chain().focus().toggleStrike().run()
  }
] as const;

function applyLink(editor: TiptapEditor) {
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
              <div className="task-tiptap__toolbar" role="toolbar" aria-label="document-formatting-toolbar">
                <div className="task-tiptap__toolbar-group">
                  {documentControls.map((control) => (
                    <button
                      key={control.id}
                      type="button"
                      className="task-tiptap__toolbar-button"
                      aria-label={control.label}
                      title={control.label}
                      data-active={control.active(editor)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => control.run(editor)}
                    >
                      {control.short ?? control.label}
                    </button>
                  ))}
                </div>
                <div className="task-tiptap__toolbar-separator" aria-hidden="true" />
                <div className="task-tiptap__toolbar-group">
                  {inlineControls.map((control) => (
                    <button
                      key={control.id}
                      type="button"
                      className="task-tiptap__toolbar-button task-tiptap__toolbar-button--icon"
                      aria-label={control.label}
                      title={control.label}
                      data-active={control.active(editor)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => control.run(editor)}
                    >
                      {control.short}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="task-tiptap__toolbar-button"
                    aria-label="链接"
                    title="链接"
                    data-active={editor.isActive("link")}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyLink(editor)}
                  >
                    链接
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
