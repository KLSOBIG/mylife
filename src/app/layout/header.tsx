import type { PageId, Workspace } from "../../domain/types";

const titles: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: "仪表盘", subtitle: "2 秒看清今天必须你关注什么" },
  events: { title: "事件流", subtitle: "按注意力级别分流全部外部信息" },
  tasks: { title: "任务", subtitle: "系统只分发，执行器执行" },
  executors: { title: "执行器", subtitle: "查看谁在干活，谁空闲，谁异常" },
  rules: { title: "规则引擎", subtitle: "条件匹配和动作分发中心" },
  sources: { title: "信息源", subtitle: "统一接入钉钉、邮件、RSS 和执行入口" }
};

export function Header(props: {
  currentPage: PageId;
  currentWorkspace: Workspace;
  chatOpen: boolean;
  onToggleChat: () => void;
}) {
  const copy = titles[props.currentPage];
  return (
    <header className="header">
      <div>
        <h1>{copy.title}</h1>
        <p>
          {props.currentWorkspace.name} / {copy.subtitle}
        </p>
      </div>
      <div className="header-actions">
        <span className="header-kbd">⌘K 命令面板</span>
        <button type="button" className="btn secondary" onClick={props.onToggleChat}>
          {props.chatOpen ? "关闭对话" : "打开对话"}
        </button>
        <button type="button" className="btn primary">
          创建任务
        </button>
      </div>
    </header>
  );
}
