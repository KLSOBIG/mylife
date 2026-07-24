import type { PageId } from "../../domain/types";
import type { Workspace } from "../../domain/types";
import { WorkspaceSwitcher } from "../../features/workspaces/workspace-switcher";

const navItems: Array<{ id: PageId; label: string; icon: string; section: "core" | "ai" | "integration" }> = [
  { id: "dashboard", label: "仪表盘", icon: "📊", section: "core" },
  { id: "events", label: "事件流", icon: "📥", section: "core" },
  { id: "tasks", label: "任务", icon: "📋", section: "core" },
  { id: "executors", label: "执行器", icon: "🤖", section: "ai" },
  { id: "rules", label: "规则引擎", icon: "⚙️", section: "ai" },
  { id: "sources", label: "信息源", icon: "🔗", section: "integration" },
  { id: "plugins", label: "插件", icon: "🧩", section: "integration" }
];

const sections = [
  { id: "core", label: "" },
  { id: "ai", label: "AI 治理" },
  { id: "integration", label: "接入" }
] as const;

export function Sidebar(props: {
  currentPage: PageId;
  currentWorkspaceId: string;
  workspaces: Workspace[];
  onPageChange: (page: PageId) => void;
  onWorkspaceChange: (workspaceId: string) => void;
  onCreateWorkspace?: (draft: { name: string; kind: Workspace["kind"]; description: string; icon: string }) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-hd">
        <div className="logo">N</div>
        <div className="sidebar-brand">
          <div className="app-name">Nexus</div>
        </div>
      </div>
      <section className="workspace-shell">
        <WorkspaceSwitcher
          currentWorkspaceId={props.currentWorkspaceId}
          workspaces={props.workspaces}
          onSwitch={props.onWorkspaceChange}
          onCreateWorkspace={props.onCreateWorkspace}
        />
      </section>
      <nav className="sidebar-nav" aria-label="主导航">
        {sections.map((section) => (
          <div className="nav-s" key={section.id}>
            {section.label ? <div className="nav-st">{section.label}</div> : null}
            {navItems
              .filter((item) => item.section === section.id)
              .map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={item.id === props.currentPage ? "nav-i active" : "nav-i"}
                  onClick={() => props.onPageChange(item.id)}
                  aria-label={item.label}
                >
                  <span className="ic" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-ft">
        <div className="avatar">K</div>
        <div className="sidebar-user">
          <div className="user-name">Kael</div>
          <div className="user-mode">保守模式</div>
        </div>
      </div>
    </aside>
  );
}
