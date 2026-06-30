import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TodayBoard } from "./today-board";

describe("TodayBoard", () => {
  it("renders default status groups", () => {
    render(<TodayBoard />);
    expect(screen.getByText("未开始")).toBeInTheDocument();
    expect(screen.getByText("进行中")).toBeInTheDocument();
    expect(screen.getByText("已完成")).toBeInTheDocument();
    expect(screen.getByText("废弃")).toBeInTheDocument();
  });
});
