import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./app";

describe("App", () => {
  it("renders dashboard by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "仪表盘" })).toBeInTheDocument();
    expect(screen.getByText("今日接收事件数")).toBeInTheDocument();
  });

  it("switches workspace and updates title", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /个人空间 工作空间切换/ }));
    await user.click(screen.getByRole("button", { name: /团队空间/ }));
    expect(screen.getByText(/团队空间 \/ 2 秒看清今天必须你关注什么/)).toBeInTheDocument();
  });

  it("filters events by attention level", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "事件流" }));
    await user.click(screen.getByRole("button", { name: "L3" }));
    expect(screen.getByText("服务器 CPU 告警，生产集群需要排查")).toBeInTheDocument();
    expect(screen.queryByText("客户投诉邮件，要求今天给出答复")).not.toBeInTheDocument();
  });

  it("filters events by source and query", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "事件流" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "事件来源筛选" }), "邮件");
    await user.type(screen.getByRole("textbox", { name: "搜索事件" }), "客户");
    expect(screen.getByText("客户投诉邮件，要求今天给出答复")).toBeInTheDocument();
    expect(screen.queryByText("服务器 CPU 告警，生产集群需要排查")).not.toBeInTheDocument();
  });

  it("opens task detail in right panel", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /处理服务器告警/ }));
    const detailPanel = document.querySelector(".detail-panel.open");
    expect(detailPanel).not.toBeNull();
    expect(within(detailPanel as HTMLElement).getByText("任务详情")).toBeInTheDocument();
    expect(
      within(detailPanel as HTMLElement).getByText("先确认是否误报，再决定是否拉起应急响应。")
    ).toBeInTheDocument();
  });

  it("assigns executor from task detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /处理服务器告警/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "执行器" }), "exec_lobster");
    expect(screen.getByRole("combobox", { name: "执行器" })).toHaveValue("exec_lobster");
  });

  it("switches task view to list mode", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: "列表" }));
    expect(screen.getByRole("button", { name: "列表" })).toHaveAttribute("aria-pressed", "true");
  });

  it("converts an event into a task from detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "事件流" }));
    await user.click(screen.getByRole("button", { name: /客户投诉邮件，要求今天给出答复/ }));
    await user.click(screen.getByRole("button", { name: "转为任务" }));
    expect(screen.getByRole("heading", { name: "任务" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /客户投诉邮件，要求今天给出答复/ })).toBeInTheDocument();
  });

  it("opens command palette with meta+k and switches page", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("{Meta>}k{/Meta}");
    const dialog = screen.getByRole("dialog", { name: "命令面板" });
    await user.click(within(dialog).getByRole("button", { name: "打开任务" }));
    expect(screen.getByRole("heading", { name: "任务" })).toBeInTheDocument();
  });

  it("creates a task from chat input", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole("textbox", { name: "对话输入框" });
    await user.type(input, "创建一个紧急任务，跟进老板邮件{enter}");
    await user.click(screen.getByRole("button", { name: "任务" }));
    expect(screen.getByRole("button", { name: /跟进老板邮件/ })).toBeInTheDocument();
  });

  it("switches chat panel to modal mode", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "弹窗" }));
    expect(screen.getByRole("dialog", { name: "对话引擎" })).toBeInTheDocument();
  });

  it("creates workspace and switches to it", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /个人空间 工作空间切换/ }));
    await user.click(screen.getByRole("button", { name: "新建工作空间" }));
    await user.type(screen.getByRole("textbox", { name: "工作空间名称" }), "实验空间");
    await user.selectOptions(screen.getByRole("combobox", { name: "工作空间类型" }), "study");
    await user.type(screen.getByRole("textbox", { name: "工作空间描述" }), "命令面板和规则实验");
    await user.click(screen.getByRole("button", { name: "创建工作空间" }));
    expect(screen.getByText(/实验空间 \/ 2 秒看清今天必须你关注什么/)).toBeInTheDocument();
  });

  it("toggles rule state", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "规则引擎" }));
    await user.click(screen.getByRole("button", { name: "切换规则 紧急事件自动升级" }));
    expect(screen.getByText("已停用")).toBeInTheDocument();
  });

  it("updates executor metrics after assigning task", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /处理服务器告警/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "执行器" }), "exec_lobster");
    await user.click(screen.getByRole("button", { name: "执行器" }));

    const lobsterCard = screen.getByText("龙虾").closest(".entity-card");
    expect(lobsterCard).not.toBeNull();
    expect(within(lobsterCard as HTMLElement).getByText("3")).toBeInTheDocument();
  });
});
