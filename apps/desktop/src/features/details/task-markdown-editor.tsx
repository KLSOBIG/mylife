import { Fragment, useState } from "react";
import { parseMarkdownBlocks } from "./markdown-helpers";

const viewModes = [
  { id: "edit", label: "编写" },
  { id: "preview", label: "预览" },
  { id: "split", label: "分栏" }
] as const;

export function TaskMarkdownEditor({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  const blocks = parseMarkdownBlocks(value);
  const showEditor = viewMode === "edit" || viewMode === "split";
  const showPreview = viewMode === "preview" || viewMode === "split";

  return (
    <section
      className={`task-markdown-editor task-markdown-editor--${viewMode}`}
      data-view-mode={viewMode}
    >
      <div className="task-markdown-editor__toolbar">
        <label className="task-markdown-editor__label" htmlFor="task-markdown-editor">
          Markdown
        </label>
        <div className="task-markdown-editor__mode-switch" role="tablist" aria-label="markdown-view-mode">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={viewMode === mode.id}
              className={viewMode === mode.id ? "task-markdown-editor__mode-button is-active" : "task-markdown-editor__mode-button"}
              onClick={() => setViewMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      <div className="task-markdown-editor__surface">
        {showEditor ? (
          <div className="task-markdown-editor__input">
            <textarea
              id="task-markdown-editor"
              aria-label="markdown-editor"
              className="task-markdown-editor__textarea"
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
          </div>
        ) : null}
        {showPreview ? (
          <section
            aria-label="markdown-preview"
            className="task-markdown-editor__preview"
          >
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
            {blocks.length === 0 ? <Fragment>暂无内容</Fragment> : null}
          </section>
        ) : null}
      </div>
    </section>
  );
}
