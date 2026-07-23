import type { TaskItem, TaskStatus } from "../../domain/types";

const columns: Array<{ id: TaskStatus; label: string }> = [
  { id: "pending_assignment", label: "待分配" },
  { id: "assigned", label: "已分配" },
  { id: "in_progress", label: "进行中" },
  { id: "pending_review", label: "待审核" },
  { id: "completed", label: "已完成" }
];

export function TasksPage(props: {
  tasks: TaskItem[];
  selectedTaskId?: string;
  onSelect: (taskId: string) => void;
}) {
  return (
    <div className="kanban">
      {columns.map((column) => (
        <section key={column.id} className="kanban-column">
          <header className="kanban-column-header">
            <h3>{column.label}</h3>
            <span>{props.tasks.filter((item) => item.status === column.id).length}</span>
          </header>
          <div className="kanban-stack">
            {props.tasks
              .filter((item) => item.status === column.id)
              .map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={item.id === props.selectedTaskId ? "task-card selected" : "task-card"}
                  onClick={() => props.onSelect(item.id)}
                >
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <span>
                    {item.level} / {item.priority}
                  </span>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
