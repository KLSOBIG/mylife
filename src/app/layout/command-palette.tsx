import { useEffect, useMemo, useRef } from "react";

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  group?: string;
  keywords?: string[];
  disabled?: boolean;
}

export function CommandPalette(props: {
  open: boolean;
  items: CommandPaletteItem[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (item: CommandPaletteItem) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    queueMicrotask(() => inputRef.current?.focus());
  }, [props.open]);

  const items = useMemo(() => filterItems(props.items, props.query), [props.items, props.query]);

  useEffect(() => {
    if (!props.open && props.query) {
      props.onQueryChange("");
    }
  }, [props.open, props.onQueryChange, props.query]);

  if (!props.open) {
    return null;
  }

  return (
    <div className="command-palette" role="dialog" aria-modal="true" aria-label="命令面板">
      <button type="button" className="command-palette__backdrop" aria-label="关闭命令面板" onClick={props.onClose} />
      <section className="command-palette__panel">
        <div className="command-palette__search">
          <span className="command-palette__glyph" aria-hidden="true">
            ⌘K
          </span>
          <input
            ref={inputRef}
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                props.onClose();
                return;
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const first = items.find((item) => !item.disabled);
                if (first) {
                  props.onSelect(first);
                }
              }
            }}
            placeholder="搜索页面、动作、任务"
            aria-label="命令搜索"
          />
        </div>

        <div className="command-palette__list" role="listbox" aria-label="命令列表">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                type="button"
                key={item.id}
                className="command-palette__item"
                aria-label={item.label}
                disabled={item.disabled}
                onClick={() => props.onSelect(item)}
              >
                <span className="command-palette__item-main">
                  <strong>{item.label}</strong>
                  {item.description ? <span>{item.description}</span> : null}
                </span>
                <span className="command-palette__item-meta">
                  {item.group ? <small>{item.group}</small> : null}
                  {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
                </span>
              </button>
            ))
          ) : (
            <div className="command-palette__empty">没找到匹配命令。</div>
          )}
        </div>
      </section>
    </div>
  );
}

function filterItems(items: CommandPaletteItem[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [item.label, item.description, item.group, item.shortcut, ...(item.keywords ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}
