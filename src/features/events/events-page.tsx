import type { AttentionLevel, EventItem } from "../../domain/types";

const filters: Array<"all" | AttentionLevel> = ["all", "L3", "L2", "L1", "L0"];

export function EventsPage(props: {
  events: EventItem[];
  selectedEventId?: string;
  activeFilter: "all" | AttentionLevel;
  onSelect: (eventId: string) => void;
  onFilterChange: (next: "all" | AttentionLevel) => void;
}) {
  const visibleEvents =
    props.activeFilter === "all" ? props.events : props.events.filter((item) => item.level === props.activeFilter);

  return (
    <div className="page-body">
      <div className="toolbar">
        <div className="chips">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={filter === props.activeFilter ? "chip active" : "chip"}
              onClick={() => props.onFilterChange(filter)}
            >
              {filter === "all" ? "全部" : filter}
            </button>
          ))}
        </div>
      </div>
      <div className="list-wrap">
        {visibleEvents.map((item) => (
          <button
            type="button"
            key={item.id}
            className={item.id === props.selectedEventId ? "event-card selected" : "event-card"}
            onClick={() => props.onSelect(item.id)}
          >
            <div className={`level-pill ${item.level.toLowerCase()}`}>{item.level}</div>
            <div className="event-copy">
              <strong>{item.title}</strong>
              <p>
                {item.source} / {item.sender} / {item.happenedAt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
