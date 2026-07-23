import { describe, expect, it } from "vitest";
import { parseIntent } from "./intents";

describe("parseIntent", () => {
  it("parses create task intent with urgent priority", () => {
    expect(parseIntent("创建一个紧急任务，处理客户投诉")).toEqual({
      kind: "create-task",
      title: "处理客户投诉",
      priority: "urgent"
    });
  });

  it("parses switch page intent", () => {
    expect(parseIntent("打开规则引擎")).toEqual({
      kind: "switch-page",
      page: "rules"
    });
  });

  it("parses create rule intent", () => {
    expect(parseIntent("当收到紧急消息时，立即通知我")).toEqual({
      kind: "create-rule",
      title: "立即通知我",
      conditionHint: "收到紧急消息"
    });
  });

  it("keeps unknown text as raw intent", () => {
    expect(parseIntent("龙虾今天处理了多少任务")).toEqual({
      kind: "unknown",
      raw: "龙虾今天处理了多少任务"
    });
  });
});
