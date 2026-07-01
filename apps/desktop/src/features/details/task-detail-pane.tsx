import { useEffect, useState } from "react";
import type { TaskDetail } from "../../lib/types";
import { GanttTab } from "./gantt-tab";
import { ReminderEditor } from "./reminder-editor";
import { TaskMarkdownEditor } from "./task-markdown-editor";
import { TaskTabs } from "./task-tabs";

export function TaskDetailPane({
  task,
  activeTab,
  onTabChange,
  onCompleteTask,
  onShelveTask,
  onResumeTask,
  onDocumentChange
}: {
  task: TaskDetail;
  activeTab?: "details" | "gantt";
  onTabChange?: (tab: "details" | "gantt") => void;
  onCompleteTask?: (taskId: string) => void;
  onShelveTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
  onDocumentChange?: (taskId: string, document: string) => void;
}) {
  const [internalTab, setInternalTab] = useState<"details" | "gantt">("details");
  const [document, setDocument] = useState(task.document);

  useEffect(() => {
    setDocument(task.document);
  }, [task.document, task.id]);

  const resolvedTab = activeTab ?? internalTab;
  const checklistCount = task.checklist.length;
  const statusLabel =
    task.status === "completed"
      ? "已完成"
      : task.status === "abandoned"
        ? "废弃"
        : task.status === "shelved"
          ? "搁置"
        : task.status === "in_progress"
          ? "进行中"
          : "未开始";
  const statusChipClass =
    task.status === "completed"
      ? "status-green"
      : task.status === "abandoned"
        ? "status-rose"
        : task.status === "shelved"
          ? "status-indigo"
          : task.status === "in_progress"
            ? "status-amber"
            : "status-slate";

  function handleTabChange(tab: "details" | "gantt") {
    if (activeTab === undefined) {
      setInternalTab(tab);
    }

    onTabChange?.(tab);
  }

  return (
    <section className="task-detail-pane">
      <TaskTabs activeTab={resolvedTab} onChange={handleTabChange} />
      {resolvedTab === "details" ? (
        <section
          id="task-panel-details"
          role="tabpanel"
          aria-labelledby="task-tab-details"
          className="task-detail-pane__panel"
        >
          <header className="task-detail-pane__header">
            <div className="task-detail-pane__title-block">
              <span className="task-detail-pane__eyebrow">任务文档</span>
              <h2>{task.title}</h2>
            </div>
            <div className="task-detail-pane__summary">
              <span>{checklistCount} 条子任务</span>
              <div className="task-detail-pane__header-actions">
                {task.status !== "completed" && task.status !== "abandoned" ? (
                  <button type="button" onClick={() => onCompleteTask?.(task.id)}>
                    完成
                  </button>
                ) : null}
                {task.status === "in_progress" ? (
                  <button type="button" onClick={() => onShelveTask?.(task.id)}>
                    搁置
                  </button>
                ) : null}
                {task.status === "shelved" ? (
                  <button type="button" onClick={() => onResumeTask?.(task.id)}>
                    恢复进行
                  </button>
                ) : null}
              </div>
            </div>
          </header>
          <div className="task-detail-pane__toolbelt">
            <span className={`task-chip ${statusChipClass}`}>
              {statusLabel}
            </span>
            <span className="task-detail-pane__count-pill">{checklistCount} 条任务</span>
            <ReminderEditor reminder={task.reminder} className="task-detail-pane__reminder-inline" />
          </div>
          <div className="task-detail-pane__content">
            <TaskMarkdownEditor
              documentId={task.id}
              value={document}
              onChange={(nextDocument) => {
                setDocument(nextDocument);
                onDocumentChange?.(task.id, nextDocument);
              }}
            />
          </div>
        </section>
      ) : (
        <section
          id="task-panel-gantt"
          role="tabpanel"
          aria-labelledby="task-tab-gantt"
          className="task-detail-pane__panel"
        >
          <GanttTab task={task.timeline ?? { rows: [] }} />
        </section>
      )}
    </section>
  );
}
