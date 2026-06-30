import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
import { buildTaskLanes, moveTaskSummaries } from "../../lib/task-state";
import type { TaskMoveRequest, TaskStatus, TaskSummary } from "../../lib/types";
import { TaskCardOverlay } from "./task-card";
import { TaskLane } from "./task-lane";

const defaultCollapsedState: Record<TaskStatus, boolean> = {
  not_started: false,
  in_progress: false,
  shelved: false,
  completed: false,
  abandoned: false
};

export function TaskLaneBoard({
  tasks = [],
  draftTitle = "",
  isComposerOpen = false,
  onDraftTitleChange,
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
  onCreateSave?: () => void;
  onSelectTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onShelveTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
  onTaskMove?: (request: TaskMoveRequest) => void;
}) {
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const [collapsed, setCollapsed] = useState(defaultCollapsedState);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(isComposerOpen);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    setComposerOpen(isComposerOpen);
  }, [isComposerOpen]);

  const lanes = useMemo(() => buildTaskLanes(orderedTasks), [orderedTasks]);
  const activeTask = activeTaskId
    ? orderedTasks.find((task) => task.id === activeTaskId) ?? null
    : null;

  function handleCreateSave() {
    if (!draftTitle.trim()) {
      handleCreateDiscard();
      return;
    }

    onCreateSave?.();
    setComposerOpen(false);
  }

  function handleCreateDiscard() {
    onDraftTitleChange?.("");
    setComposerOpen(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);

    const request = resolveMoveRequest(
      orderedTasks,
      String(event.active.id),
      event.over ? String(event.over.id) : null
    );

    if (!request) {
      return;
    }

    const nextTasks = moveTaskSummaries(orderedTasks, request);
    setOrderedTasks(nextTasks);
    onTaskMove?.(request);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveTaskId(String(event.active.id))}
      onDragCancel={() => setActiveTaskId(null)}
      onDragEnd={handleDragEnd}
    >
      <section
        aria-label="task-lane-board"
        data-orientation="vertical"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        {lanes.map((lane) => (
          <TaskLane
            key={lane.status}
            lane={lane}
            collapsed={collapsed[lane.status]}
            showInlineCreator={composerOpen && lane.status === "not_started"}
            draftTitle={draftTitle}
            onToggle={(status) =>
              setCollapsed((current) => ({
                ...current,
                [status]: !current[status]
              }))
            }
            onDraftTitleChange={onDraftTitleChange}
            onCreateSave={handleCreateSave}
            onCreateDiscard={handleCreateDiscard}
            onSelectTask={onSelectTask}
            onCompleteTask={onCompleteTask}
            onShelveTask={onShelveTask}
            onResumeTask={onResumeTask}
          />
        ))}
      </section>
      <DragOverlay>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function resolveMoveRequest(
  tasks: TaskSummary[],
  activeId: string,
  overId: string | null
): TaskMoveRequest | null {
  if (!overId || activeId === overId) {
    return null;
  }

  if (overId.startsWith("lane:")) {
    const toStatus = overId.slice(5) as TaskStatus;
    const toIndex = tasks.filter((task) => task.status === toStatus && task.id !== activeId).length;
    return {
      taskId: activeId,
      toStatus,
      toIndex
    };
  }

  const overTask = tasks.find((task) => task.id === overId);
  if (!overTask) {
    return null;
  }

  const toIndex = tasks.filter(
    (task) => task.status === overTask.status && task.id !== activeId
  ).findIndex((task) => task.id === overTask.id);

  return {
    taskId: activeId,
    toStatus: overTask.status,
    toIndex: Math.max(toIndex, 0)
  };
}
