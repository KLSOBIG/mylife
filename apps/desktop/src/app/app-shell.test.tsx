import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("renders today header", () => {
    render(<AppShell />);
    expect(screen.getByRole("heading", { name: "今天" })).toBeInTheDocument();
  });
});
