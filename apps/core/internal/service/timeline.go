package service

import (
	"sort"

	"github.com/KLSOBIG/mylife/apps/core/internal/domain"
)

type TimelineSegment struct {
	Status string
}

func BuildTimeline(events []domain.TaskEvent) []TimelineSegment {
	if len(events) == 0 {
		return nil
	}

	sorted := append([]domain.TaskEvent(nil), events...)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].OccurredAt < sorted[j].OccurredAt
	})

	segments := make([]TimelineSegment, 0, len(sorted))
	for _, event := range sorted {
		segments = append(segments, TimelineSegment{Status: event.ToStatus})
	}

	return segments
}
