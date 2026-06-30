import { useEffect, useState } from "react";
import type { TaskDetail } from "../../lib/types";
import { GanttTab } from "./gantt-tab";
import { ReminderEditor } from "./reminder-editor";
import { TaskChecklistTree } from "./task-checklist-tree";
import { TaskMarkdownEditor } from "./task-markdown-editor";
import { TaskTabs } from "./task-tabs";

export function TaskDetailPane({
  task,
  activeTab,
  onTabChange,
  onCompleteTask,
  onAdvanceTask
}: {
  task: TaskDetail;
  activeTab?: "details" | "gantt";
  onTabChange?: (tab: "details" | "gantt") => void;
  onCompleteTask?: (taskId: string) => void;
  onAdvanceTask?: (taskId: string) => void;
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
        : task.status === "in_progress"
          ? "进行中"
          : "未开始";

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
              <span>{checklistCount} 条任务</span>
              <div className="task-detail-pane__header-actions">
                {task.status !== "completed" ? (
                  <button type="button" onClick={() => onCompleteTask?.(task.id)}>
                    完成
                  </button>
                ) : null}
                {task.status !== "completed" && task.status !== "abandoned" ? (
                  <button type="button" onClick={() => onAdvanceTask?.(task.id)}>
                    下一状态
                  </button>
                ) : null}
              </div>
            </div>
          </header>
          <div className="task-detail-pane__content">
            <TaskMarkdownEditor value={document} onChange={setDocument} />
            <aside className="task-detail-pane__secondary">
              <section className="task-detail-pane__meta">
                <h3>任务信息</h3>
                <div className="task-detail-pane__meta-grid">
                  <div className="task-detail-pane__meta-row">
                    <span>状态</span>
                    <span>{statusLabel}</span>
                  </div>
                  <div className="task-detail-pane__meta-row">
                    <span>提醒</span>
                    <span>{task.reminder.at}</span>
                  </div>
                  <div className="task-detail-pane__meta-row">
                    <span>任务树</span>
                    <span>{checklistCount} 项</span>
                  </div>
                </div>
                <ReminderEditor reminder={task.reminder} className="task-detail-pane__reminder-card" />
              </section>
              <TaskChecklistTree markdown={document} fallbackItems={task.checklist} />
            </aside>
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
