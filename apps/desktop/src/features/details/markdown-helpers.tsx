import type { ChecklistItem } from "../../lib/types";

export type ChecklistNode = {
  id: string;
  checked: boolean;
  depth: number;
  text: string;
  children: ChecklistNode[];
};

const checkboxPattern = /^(\s*)-\s\[( |x|X)\]\s(.+)$/;

export function parseChecklistTree(
  markdown: string,
  fallbackItems: ChecklistItem[] = []
): ChecklistNode[] {
  const lines = markdown.split("\n");
  const roots: ChecklistNode[] = [];
  const stack: ChecklistNode[] = [];

  lines.forEach((line, index) => {
    const checkbox = line.match(checkboxPattern);

    if (!checkbox) {
      return;
    }

    const depth = Math.floor(checkbox[1].length / 2);
    const node: ChecklistNode = {
      id: `checkbox_${index}`,
      checked: checkbox[2].toLowerCase() === "x",
      depth,
      text: checkbox[3].trim(),
      children: []
    };

    while (stack.length > depth) {
      stack.pop();
    }

    if (depth === 0 || stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack[depth] = node;
  });

  if (roots.length > 0) {
    return roots;
  }

  return fallbackItems.map((item, index) => ({
    id: item.id || `fallback_${index}`,
    checked: item.status === "completed",
    depth: 0,
    text: item.title,
    children: []
  }));
}
