import { expect, test } from "@playwright/test";

test("create task, complete task, undo task", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "快速新增 +" }).click();
  await page.getByPlaceholder("输入任务标题").fill("设计桌面小窗交互");
  await page.getByRole("button", { name: "保存任务" }).click();
  await page.getByText("设计桌面小窗交互").first().click();
  await page.getByLabel("details-pane").getByRole("button", { name: "完成" }).click();
  await expect(page.getByRole("status")).toContainText("5 秒内可撤销");
  await page.getByRole("button", { name: "撤销" }).click();
  await expect(page.getByRole("heading", { name: "进行中" })).toBeVisible();
});
