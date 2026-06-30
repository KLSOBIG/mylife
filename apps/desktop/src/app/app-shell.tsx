import { MonthFilter } from "../features/calendar/month-filter";
import { TodayBoard } from "../features/tasks/today-board";
import { WorkspaceList } from "../features/workspaces/workspace-list";
import "../styles/app.css";

export function AppShell() {
  return (
    <main className="app-shell">
      <aside className="left-pane">
        <MonthFilter />
        <WorkspaceList />
      </aside>
      <TodayBoard />
      <section aria-label="details-pane" className="details-pane">
        <h2>任务详情</h2>
      </section>
    </main>
  );
}
