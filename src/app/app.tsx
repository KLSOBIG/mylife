import { useMemo, useReducer } from "react";
import { chartSeries, chatMessages, events, executors, rules, sources, tasks, workspaces } from "../domain/mock-data";
import { createInitialState, reduceState } from "../domain/store";
import type { EventItem, TaskItem } from "../domain/types";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { EventsPage } from "../features/events/events-page";
import { ExecutorsPage } from "../features/executors/executors-page";
import { RulesPage } from "../features/rules/rules-page";
import { SourcesPage } from "../features/sources/sources-page";
import { TasksPage } from "../features/tasks/tasks-page";
import { ChatPanel } from "./layout/chat-panel";
import { DetailPanel } from "./layout/detail-panel";
import { Header } from "./layout/header";
import { Sidebar } from "./layout/sidebar";

export function App() {
  const [state, dispatch] = useReducer(reduceState, undefined, createInitialState);
  const currentWorkspace = workspaces.find((item) => item.id === state.currentWorkspaceId) ?? workspaces[0];
  const filteredEvents = useMemo(
    () => events.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [state.currentWorkspaceId]
  );
  const filteredTasks = useMemo(
    () => tasks.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [state.currentWorkspaceId]
  );
  const filteredExecutors = useMemo(
    () => executors.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [state.currentWorkspaceId]
  );
  const filteredRules = useMemo(
    () => rules.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [state.currentWorkspaceId]
  );
  const filteredSources = useMemo(
    () => sources.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [state.currentWorkspaceId]
  );

  const selectedEvent = findById(filteredEvents, state.selectedEventId);
  const selectedTask = findById(filteredTasks, state.selectedTaskId);

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={state.currentPage}
        currentWorkspaceId={state.currentWorkspaceId}
        workspaces={workspaces}
        onPageChange={(page) => dispatch({ type: "page/switched", page })}
        onWorkspaceChange={(workspaceId) => dispatch({ type: "workspace/switched", workspaceId })}
      />

      <div className="main-shell">
        <Header
          currentPage={state.currentPage}
          currentWorkspace={currentWorkspace}
          chatOpen={state.chatOpen}
          onToggleChat={() => dispatch({ type: "chat/toggled" })}
        />

        <section className="page-shell">
          {state.currentPage === "dashboard" ? (
            <DashboardPage
              workspace={currentWorkspace}
              events={filteredEvents}
              executors={filteredExecutors}
              chartSeries={chartSeries}
            />
          ) : null}

          {state.currentPage === "events" ? (
            <EventsPage
              events={filteredEvents}
              selectedEventId={state.selectedEventId}
              activeFilter={state.eventFilter}
              onSelect={(eventId) => dispatch({ type: "event/selected", eventId })}
              onFilterChange={(filter) => dispatch({ type: "events/filterChanged", filter })}
            />
          ) : null}

          {state.currentPage === "tasks" ? (
            <TasksPage
              tasks={filteredTasks}
              selectedTaskId={state.selectedTaskId}
              onSelect={(taskId) => dispatch({ type: "task/selected", taskId })}
            />
          ) : null}

          {state.currentPage === "executors" ? <ExecutorsPage executors={filteredExecutors} /> : null}
          {state.currentPage === "rules" ? <RulesPage rules={filteredRules} /> : null}
          {state.currentPage === "sources" ? <SourcesPage sources={filteredSources} /> : null}
        </section>
      </div>

      <DetailPanel event={selectedEvent} task={selectedTask} />
      <ChatPanel
        open={state.chatOpen}
        pinned={state.chatPinned}
        messages={chatMessages}
        onTogglePinned={() => dispatch({ type: "chat/pinnedToggled" })}
      />
    </div>
  );
}

function findById<T extends { id: string }>(items: T[], id?: string): T | undefined {
  return id ? items.find((item) => item.id === id) : undefined;
}
