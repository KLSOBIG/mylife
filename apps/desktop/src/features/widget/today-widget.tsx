import type { WidgetTask } from "../../lib/types";

export function TodayWidget({
  tasks,
  onRefresh,
  onOpenMain,
  onCompleteTask,
  onShelveTask,
  onOpenTask
}: {
  tasks: WidgetTask[];
  onRefresh?: () => void;
  onOpenMain?: () => void;
  onCompleteTask?: (taskId: string) => void;
  onShelveTask?: (taskId: string) => void;
  onOpenTask?: (taskId: string) => void;
}) {
  return (
    <section className="today-widget">
      <header className="today-widget__header">
        <div>
          <h2>今天进行中</h2>
          <p>读取本地任务数据</p>
        </div>
        <div className="today-widget__header-actions">
          <button type="button" onClick={onRefresh}>
            刷新
          </button>
          <button type="button" onClick={onOpenMain}>
            打开主窗口
          </button>
        </div>
      </header>
      <div className="today-widget__list">
        {tasks.map((task) => (
          <article key={task.id} className="today-widget__card">
            <h3>{task.title}</h3>
            <div className="today-widget__actions">
              <button type="button" onClick={() => onCompleteTask?.(task.id)}>
                完成
              </button>
              <button type="button" onClick={() => onShelveTask?.(task.id)}>
                搁置
              </button>
              <button type="button" onClick={() => onOpenTask?.(task.id)}>
                详情
              </button>
            </div>
          </article>
        ))}
        {tasks.length === 0 ? <div className="today-widget__empty">暂无今天进行中任务</div> : null}
      </div>
    </section>
  );
}
