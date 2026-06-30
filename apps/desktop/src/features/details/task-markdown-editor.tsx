import { Fragment } from "react";
import { parseMarkdownBlocks } from "./markdown-helpers";

export function TaskMarkdownEditor({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const blocks = parseMarkdownBlocks(value);

  return (
    <section className="task-markdown-editor">
      <div className="task-markdown-editor__input">
        <label className="task-markdown-editor__label" htmlFor="task-markdown-editor">
          Markdown
        </label>
        <textarea
          id="task-markdown-editor"
          aria-label="markdown-editor"
          className="task-markdown-editor__textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
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
    </section>
  );
}
