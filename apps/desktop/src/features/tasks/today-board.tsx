import { themes, type ThemeName } from "../../lib/task-state";
import type { TaskMoveRequest, TaskSummary } from "../../lib/types";
import { TaskLaneBoard } from "./task-lane-board";

const themeLabels: Record<ThemeName, string> = {
  olive: "苔绿",
  amber: "赤陶",
  slate: "石板"
};

export function TodayBoard({
  tasks = [],
  draftTitle = "",
  isComposerOpen = false,
  onDraftTitleChange,
  onCreateClick,
  onCreateSave,
  onSelectTask,
  onCompleteTask,
  onShelveTask,
  onResumeTask,
  onTaskMove,
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
  onShelveTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
  onTaskMove?: (request: TaskMoveRequest) => void;
  onThemeChange?: (theme: ThemeName) => void;
}) {
  return (
    <section className="today-board">
      <header className="today-header">
        <div className="today-header__title">
          <p className="today-header__eyebrow">Today Focus</p>
          <h1>今天</h1>
        </div>
        <div className="today-header__actions">
          <div className="theme-switch" role="group" aria-label="主题切换">
            {themes.map((theme) => (
              <button
                key={theme}
                type="button"
                aria-label={`theme-${theme}`}
                className={`theme-switch__item theme-switch__item--${theme}`}
                onClick={() => onThemeChange?.(theme)}
              >
                <span className={`theme-switch__swatch theme-switch__swatch--${theme}`} aria-hidden="true" />
                <span>{themeLabels[theme]}</span>
              </button>
            ))}
          </div>
          <button type="button" className="toolbar-button toolbar-button--primary" onClick={onCreateClick}>
            快速新增 +
          </button>
        </div>
      </header>
      <TaskLaneBoard
        tasks={tasks}
        draftTitle={draftTitle}
        isComposerOpen={isComposerOpen}
        onDraftTitleChange={onDraftTitleChange}
        onCreateSave={onCreateSave}
        onSelectTask={onSelectTask}
        onCompleteTask={onCompleteTask}
        onShelveTask={onShelveTask}
        onResumeTask={onResumeTask}
        onTaskMove={onTaskMove}
      />
    </section>
  );
}
