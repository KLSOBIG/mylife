import type { ChecklistItem } from "../../lib/types";

export type ChecklistNode = {
  id: string;
  checked: boolean;
  depth: number;
  text: string;
  children: ChecklistNode[];
};

export type MarkdownBlock =
  | {
      type: "heading";
      depth: number;
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "checklist";
      checked: boolean;
      text: string;
    };

const checkboxPattern = /^(\s*)-\s\[( |x|X)\]\s(.+)$/;
const headingPattern = /^(#{1,6})\s+(.+)$/;

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  return markdown
    .split("\n")
    .map((line) => {
      const heading = line.match(headingPattern);

      if (heading) {
        return {
          type: "heading" as const,
          depth: heading[1].length,
          text: heading[2].trim()
        };
      }

      const checkbox = line.match(checkboxPattern);

      if (checkbox) {
        return {
          type: "checklist" as const,
          checked: checkbox[2].toLowerCase() === "x",
          text: checkbox[3].trim()
        };
      }

      const text = line.trim();

      if (!text) {
        return null;
      }

      return {
        type: "paragraph" as const,
        text
      };
    })
    .filter((block): block is MarkdownBlock => block !== null);
}

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
