package test

import (
	"testing"
	"time"

	"github.com/KLSOBIG/mylife/apps/core/internal/domain"
	"github.com/KLSOBIG/mylife/apps/core/internal/service"
	"github.com/stretchr/testify/require"
)

func TestTimelineSegmentsComeFromTaskEvents(t *testing.T) {
	segments := service.BuildTimeline([]domain.TaskEvent{
		{FromStatus: "", ToStatus: "not_started", OccurredAt: mustTime("2026-06-30T09:00:00Z").Format(time.RFC3339)},
		{FromStatus: "not_started", ToStatus: "in_progress", OccurredAt: mustTime("2026-06-30T10:00:00Z").Format(time.RFC3339)},
		{FromStatus: "in_progress", ToStatus: "completed", OccurredAt: mustTime("2026-06-30T12:00:00Z").Format(time.RFC3339)},
	})

	require.Len(t, segments, 3)
	require.Equal(t, "in_progress", segments[1].Status)
}

func mustTime(input string) time.Time {
	value, err := time.Parse(time.RFC3339, input)
	if err != nil {
		panic(err)
	}
	return value
}
