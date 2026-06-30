import { expect, test } from "@playwright/test";

test("create task, complete task, undo task", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "快速新增 +" }).click();
  await page.getByPlaceholder("输入任务标题").fill("自动保存任务");
  await page.getByPlaceholder("输入任务标题").press("Tab");
  await page.locator('[data-lane-status="not_started"] .task-card button').filter({ hasText: "自动保存任务" }).first().click();
  await page.getByLabel("details-pane").getByRole("button", { name: "完成" }).click();
  await expect(page.locator(".undo-toast")).toContainText("5 秒内可撤销");
  await page.getByRole("button", { name: "撤销" }).click();
  await expect(
    page.locator('[data-lane-status="not_started"] .task-card button').filter({ hasText: "自动保存任务" }).first()
  ).toBeVisible();
});
