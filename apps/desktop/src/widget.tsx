import React from "react";
import ReactDOM from "react-dom/client";
import { TodayWidget } from "./features/widget/today-widget";

ReactDOM.createRoot(document.getElementById("widget-root")!).render(
  <React.StrictMode>
    <TodayWidget
      tasks={[
        { id: "widget_1", title: "重构任务时间轴存储", status: "in_progress" },
        { id: "widget_2", title: "设计桌面小窗交互", status: "in_progress" }
      ]}
    />
  </React.StrictMode>
);
