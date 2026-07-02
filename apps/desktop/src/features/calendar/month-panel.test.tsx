import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthFilter } from "./month-filter";
import { MonthPanel } from "./month-panel";

describe("MonthPanel", () => {
  it("renders weekday headers and full month spillover dates", () => {
    render(<MonthPanel today={new Date(2026, 5, 30)} />);

    expect(screen.getByRole("heading", { name: "六月 2026" })).toBeInTheDocument();
    expect(screen.getByText("周日")).toBeInTheDocument();
    expect(screen.getByText("周一")).toBeInTheDocument();
    expect(screen.getByText("周六")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026年5月31日 周日" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026年6月30日 周二" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026年7月4日 周六" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(35);
  });

  it("highlights today and updates selected date", async () => {
    render(
      <MonthPanel
        initialSelectedDate={new Date(2026, 5, 15)}
        today={new Date(2026, 5, 30)}
      />
    );

    const todayButton = screen.getByRole("button", { name: "2026年6月30日 周二" });
    const selectedButton = screen.getByRole("button", { name: "2026年6月15日 周一" });

    expect(todayButton).toHaveAttribute("aria-current", "date");
    expect(selectedButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "2026年6月18日 周四" }));

    expect(selectedButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "2026年6月18日 周四" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("renders workspace section in prototype shape when enabled", () => {
    render(
      <MonthPanel
        showWorkspaces
        today={new Date(2026, 5, 30)}
        workspaces={[
          { id: "my-work", name: "我的工作" },
          { id: "product-lab", name: "产品实验" },
          { id: "study", name: "个人学习" }
        ]}
        activeWorkspaceId="my-work"
      />
    );

    expect(screen.getByRole("heading", { name: "工作空间" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "我的工作" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "产品实验" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "个人学习" })).toBeInTheDocument();
  });

  it("adds workspace from inline creator", () => {
    const handleAddWorkspace = vi.fn();

    render(
      <MonthPanel
        showWorkspaces
        today={new Date(2026, 5, 30)}
        workspaces={[
          { id: "my-work", name: "我的工作" }
        ]}
        activeWorkspaceId="my-work"
        onAddWorkspace={handleAddWorkspace}
      />
    );

    fireEvent.change(screen.getByLabelText("新增工作空间"), { target: { value: "新租户" } });
    fireEvent.click(screen.getByRole("button", { name: "新增" }));

    expect(handleAddWorkspace).toHaveBeenCalledWith("新租户");
  });
});

describe("MonthFilter", () => {
  it("keeps legacy import name while rendering month calendar only", () => {
    render(<MonthFilter today={new Date(2026, 5, 30)} />);

    expect(screen.getByRole("heading", { name: "六月 2026" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "工作空间" })).not.toBeInTheDocument();
  });
});
