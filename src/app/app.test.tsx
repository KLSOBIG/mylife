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
});
