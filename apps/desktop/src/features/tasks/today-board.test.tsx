import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TodayBoard } from "./today-board";

describe("TodayBoard", () => {
  it("renders default status groups", () => {
    render(<TodayBoard />);
    expect(screen.getByRole("button", { name: "未开始 · 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进行中 · 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "搁置 · 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已完成 · 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "废弃 · 0" })).toBeInTheDocument();
  });
});
