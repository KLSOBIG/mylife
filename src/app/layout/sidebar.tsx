import type { PageId } from "../../domain/types";
import type { Workspace } from "../../domain/types";
import { WorkspaceSwitcher } from "../../features/workspaces/workspace-switcher";

const navItems: Array<{ id: PageId; label: string; icon: string }> = [
  { id: "dashboard", label: "仪表盘", icon: "◫" },
  { id: "events", label: "事件流", icon: "◉" },
  { id: "tasks", label: "任务", icon: "▣" },
  { id: "executors", label: "执行器", icon: "⚙" },
  { id: "rules", label: "规则引擎", icon: "◇" },
  { id: "sources", label: "信息源", icon: "⌁" }
];

export function Sidebar(props: {
  currentPage: PageId;
  currentWorkspaceId: string;
  workspaces: Workspace[];
  onPageChange: (page: PageId) => void;
  onWorkspaceChange: (workspaceId: string) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">N</div>
        <div>
          <div className="sidebar-title">Nexus</div>
          <div className="sidebar-subtitle">注意力保护系统</div>
        </div>
      </div>
      <WorkspaceSwitcher
        currentWorkspaceId={props.currentWorkspaceId}
        workspaces={props.workspaces}
        onSwitch={props.onWorkspaceChange}
      />
      <nav className="sidebar-nav" aria-label="主导航">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.id}
            className={item.id === props.currentPage ? "nav-item active" : "nav-item"}
            onClick={() => props.onPageChange(item.id)}
            aria-label={item.label}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="avatar">K</div>
        <div>
          <div className="sidebar-title">Kael</div>
          <div className="sidebar-subtitle">管理员</div>
        </div>
      </div>
    </aside>
  );
}
