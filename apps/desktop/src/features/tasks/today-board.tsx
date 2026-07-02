import { useState } from "react";
import type { TaskMoveRequest, TaskSummary } from "../../lib/types";
import { TaskLaneBoard } from "./task-lane-board";

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
  onTaskMove
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
}) {
  const [composerRequestId, setComposerRequestId] = useState(0);

  return (
    <section className="today-board">
      <header className="today-header">
        <div className="today-header__title">
          <p className="today-header__eyebrow">Today Focus</p>
          <h1>今天</h1>
        </div>
        <div className="today-header__actions">
          <button
            type="button"
            className="toolbar-button toolbar-button--primary"
            onClick={() => {
              setComposerRequestId((current) => current + 1);
              onCreateClick?.();
            }}
          >
            快速新增 +
          </button>
        </div>
      </header>
      <TaskLaneBoard
        tasks={tasks}
        draftTitle={draftTitle}
        isComposerOpen={isComposerOpen}
        composerRequestId={composerRequestId}
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
