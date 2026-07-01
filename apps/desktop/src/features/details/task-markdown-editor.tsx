import { useEffect, useRef, useState } from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  UndoRedo,
  diffSourcePlugin,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { parseMarkdownBlocks } from "./markdown-helpers";

const viewModes = [
  { id: "document", label: "文档" },
  { id: "markdown", label: "Markdown" },
  { id: "preview", label: "预览" }
] as const;

export function TaskMarkdownEditor({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"document" | "markdown" | "preview">("document");
  const editorRef = useRef<MDXEditorMethods>(null);
  const blocks = parseMarkdownBlocks(value);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.getMarkdown() !== value) {
      editorRef.current.setMarkdown(value);
    }
  }, [value]);

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
        <div className="task-markdown-editor__rich-shell">
          <MDXEditor
            ref={editorRef}
            className="task-markdown-editor__rich"
            contentEditableClassName="task-markdown-editor__rich-content"
            markdown={value}
            onChange={(nextMarkdown) => onChange(nextMarkdown)}
            placeholder="直接像文档一样输入内容，checkbox 会同步成任务树"
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              linkPlugin(),
              markdownShortcutPlugin(),
              diffSourcePlugin({ viewMode: "rich-text" }),
              toolbarPlugin({
                toolbarContents: () => (
                  <DiffSourceToggleWrapper options={["rich-text", "source"]}>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <BlockTypeSelect />
                    <ListsToggle />
                    <CreateLink />
                  </DiffSourceToggleWrapper>
                )
              })
            ]}
          />
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
