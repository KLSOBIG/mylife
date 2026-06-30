import { statusMeta, themes, type ThemeName } from "../../lib/task-state";
import type { TaskStatus, TaskSummary } from "../../lib/types";

const defaultGroups = ["未开始", "进行中", "已完成", "废弃"];

export function TodayBoard({
  tasks = [],
  draftTitle = "",
  isComposerOpen = false,
  onDraftTitleChange,
  onCreateClick,
  onCreateSave,
  onSelectTask,
  onCompleteTask,
  onThemeChange
}: {
  tasks?: TaskSummary[];
  draftTitle?: string;
  isComposerOpen?: boolean;
  onDraftTitleChange?: (value: string) => void;
  onCreateClick?: () => void;
  onCreateSave?: () => void;
  onSelectTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onThemeChange?: (theme: ThemeName) => void;
}) {
  const grouped = groupTasks(tasks);
  return (
    <section className="today-board">
      <header className="today-header">
        <h1>今天</h1>
        <div className="today-header__actions">
          <div className="theme-switch">
            {themes.map((theme) => (
              <button
                key={theme}
                type="button"
                aria-label={`theme-${theme}`}
                className={`theme-switch__dot theme-switch__dot--${theme}`}
                onClick={() => onThemeChange?.(theme)}
              />
            ))}
          </div>
          <button type="button" onClick={onCreateClick}>
            快速新增 +
          </button>
        </div>
      </header>
      {isComposerOpen ? (
        <div className="task-creator">
          <input
            placeholder="输入任务标题"
            value={draftTitle}
            onChange={(event) => onDraftTitleChange?.(event.target.value)}
          />
          <button type="button" onClick={onCreateSave}>
            保存任务
          </button>
        </div>
      ) : null}
      <div className="status-grid">
        {(tasks.length === 0 ? defaultGroups : Object.keys(grouped)).map((group) => (
          <article key={group} className="status-column">
            <h2>{group}</h2>
            {"length" in grouped ? null : null}
            {tasks.length > 0
              ? grouped[group].map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className="task-card"
                    onClick={() => onSelectTask?.(task.id)}
                  >
                    <strong>{task.title}</strong>
                    <span className={`task-chip ${statusMeta[task.status].chipClass}`}>
                      {statusMeta[task.status].label}
                    </span>
                    {task.reminderLabel ? <small>{task.reminderLabel}</small> : null}
                    {task.status !== "completed" ? (
                      <span
                        className="task-complete"
                        onClick={(event) => {
                          event.stopPropagation();
                          onCompleteTask?.(task.id);
                        }}
                      >
                        完成
                      </span>
                    ) : null}
                  </button>
                ))
              : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function groupTasks(tasks: TaskSummary[]) {
  const labels: Record<TaskStatus, string> = {
    not_started: "未开始",
    in_progress: "进行中",
    completed: "已完成",
    abandoned: "废弃"
  };

  return tasks.reduce<Record<string, TaskSummary[]>>((groups, task) => {
    const label = labels[task.status];
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(task);
    return groups;
  }, {
    未开始: [],
    进行中: [],
    已完成: [],
    废弃: []
  });
}
