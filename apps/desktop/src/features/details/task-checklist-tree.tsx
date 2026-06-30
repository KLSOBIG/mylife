import type { ChecklistItem } from "../../lib/types";
import { parseChecklistTree, type ChecklistNode } from "./markdown-helpers";

function ChecklistBranch({ nodes }: { nodes: ChecklistNode[] }) {
  return (
    <ul className="task-checklist-tree__branch">
      {nodes.map((node) => (
        <li
          key={node.id}
          role="treeitem"
          aria-checked={node.checked}
          aria-level={node.depth + 1}
          className="task-checklist-tree__item"
        >
          <div className="task-checklist-tree__row">
            <span className="task-checklist-tree__status">{node.checked ? "已完成" : "未完成"}</span>
            <span>{node.text}</span>
          </div>
          {node.children.length > 0 ? <ChecklistBranch nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function TaskChecklistTree({
  markdown,
  fallbackItems
}: {
  markdown: string;
  fallbackItems?: ChecklistItem[];
}) {
  const nodes = parseChecklistTree(markdown, fallbackItems);

  return (
    <section className="task-checklist-tree">
      <div className="task-checklist-tree__header">
        <h3>Checkbox 任务树</h3>
      </div>
      <div role="tree" aria-label="markdown-checklist-tree" className="task-checklist-tree__tree">
        <ChecklistBranch nodes={nodes} />
      </div>
    </section>
  );
}
