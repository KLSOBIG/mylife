package test

import (
	"testing"

	"github.com/KLSOBIG/mylife/apps/core/internal/markdown"
	"github.com/stretchr/testify/require"
)

func TestMarkdownCheckboxesBecomeChildTasks(t *testing.T) {
	input := "# 重构任务\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射\n"
	items := markdown.ParseCheckboxTasks(input)

	require.Len(t, items, 2)
	require.Equal(t, "定义 task_events 表", items[0].Title)
	require.Equal(t, "completed", items[1].Status)
}
