package test

import (
	"testing"
	"time"

	"github.com/KLSOBIG/mylife/apps/core/internal/reminder"
	"github.com/stretchr/testify/require"
)

func TestWeeklyReminderComputesNextOccurrence(t *testing.T) {
	rule := reminder.Rule{Kind: "weekly", Weekdays: []time.Weekday{time.Monday, time.Wednesday}}
	next := reminder.NextOccurrence(rule, mustTime("2026-06-30T09:00:00Z"))
	require.Equal(t, "2026-07-01T09:00:00Z", next.Format(time.RFC3339))
}
