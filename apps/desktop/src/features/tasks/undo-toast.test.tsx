import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UndoToast } from "./undo-toast";

describe("UndoToast", () => {
  it("renders one toast entry and delegates undo click", () => {
    const handleUndo = vi.fn();
    render(<UndoToast message="任务已切换到 完成" onUndo={handleUndo} />);

    fireEvent.click(screen.getByRole("button", { name: "撤销" }));

    expect(screen.getByText("任务已切换到 完成")).toBeInTheDocument();
    expect(handleUndo).toHaveBeenCalledTimes(1);
  });
});
