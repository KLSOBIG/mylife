import type { PageId, Workspace } from "./types";

export interface AppState {
  currentPage: PageId;
  currentWorkspaceId: Workspace["id"];
  selectedEventId?: string;
  selectedTaskId?: string;
  chatOpen: boolean;
  chatPinned: boolean;
  eventFilter: "all" | "L0" | "L1" | "L2" | "L3";
}

export type AppAction =
  | { type: "page/switched"; page: PageId }
  | { type: "workspace/switched"; workspaceId: string }
  | { type: "event/selected"; eventId?: string }
  | { type: "task/selected"; taskId?: string }
  | { type: "chat/toggled" }
  | { type: "chat/pinnedToggled" }
  | { type: "events/filterChanged"; filter: AppState["eventFilter"] };

export function createInitialState(): AppState {
  return {
    currentPage: "dashboard",
    currentWorkspaceId: "ws_personal",
    chatOpen: true,
    chatPinned: true,
    eventFilter: "all"
  };
}

export function reduceState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "page/switched":
      return { ...state, currentPage: action.page, selectedEventId: undefined, selectedTaskId: undefined };
    case "workspace/switched":
      return {
        ...state,
        currentWorkspaceId: action.workspaceId,
        selectedEventId: undefined,
        selectedTaskId: undefined,
        eventFilter: "all"
      };
    case "event/selected":
      return { ...state, selectedEventId: action.eventId, selectedTaskId: undefined };
    case "task/selected":
      return { ...state, selectedTaskId: action.taskId, selectedEventId: undefined };
    case "chat/toggled":
      return { ...state, chatOpen: !state.chatOpen };
    case "chat/pinnedToggled":
      return { ...state, chatPinned: !state.chatPinned };
    case "events/filterChanged":
      return { ...state, eventFilter: action.filter };
    default:
      return state;
  }
}
