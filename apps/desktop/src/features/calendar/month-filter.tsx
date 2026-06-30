import { MonthPanel, type MonthPanelProps } from "./month-panel";

export function MonthFilter(props: MonthPanelProps) {
  return <MonthPanel {...props} showWorkspaces={props.showWorkspaces ?? false} />;
}
