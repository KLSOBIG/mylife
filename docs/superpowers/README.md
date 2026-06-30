# mylife 文档索引

`docs/superpowers/` 是 `mylife` 的设计与实施源文件目录。多 agent 协作时，先看这里，再动代码。

## 目录约定

- `specs/`
  产品、交互、视觉规则。属于长期 source of truth。
- `plans/`
  实现计划、任务拆分、执行边界。
- `prototypes/`
  可审阅原型。优先 `html/md`，便于 `git diff`。

## 当前文档

### Specs

- [2026-06-30-mylife-design.md](./specs/2026-06-30-mylife-design.md)
  主设计文档。产品目标、范围、主窗口、小窗、提醒、甘特图。
- [2026-06-30-mylife-visual-system.md](./specs/2026-06-30-mylife-visual-system.md)
  视觉系统。主题、状态色、字号、间距、卡片、toast、tab 规则。
- [2026-06-30-mylife-interaction-states.md](./specs/2026-06-30-mylife-interaction-states.md)
  交互规则。任务流转、撤销、Markdown `[]` 同步、提醒、甘特图、小窗边界。
- [2026-06-30-mylife-frontend-correction.md](./specs/2026-06-30-mylife-frontend-correction.md)
  前端纠偏。针对当前 UI 与需求不符的整改要求，优先级最高。

### Plans

- [2026-06-30-mylife-v1.md](./plans/2026-06-30-mylife-v1.md)
  `v1` 实现计划。
- [2026-06-30-mylife-ui-remediation.md](./plans/2026-06-30-mylife-ui-remediation.md)
  UI 整改计划。给多 agent 并行开发的施工单。

### Prototypes

- [2026-06-30-mylife-main-window.html](./prototypes/2026-06-30-mylife-main-window.html)
  主窗口原型。三栏布局、今天视图、详情/甘特双页签、撤销 toast、主题入口。
- [2026-06-30-mylife-widget.html](./prototypes/2026-06-30-mylife-widget.html)
  桌面小窗原型。今天进行中任务、轻交互、空态、联动边界。

## 协作规则

- 设计确认后，必须先落 `specs/` 或 `prototypes/`，再改实现。
- 交互改动，同时更新对应原型。
- 范围改动，同时更新设计文档与实现计划。
- 合并前检查：本次确认过的设计资产是否都已进入 `git`。
