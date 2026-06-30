package service

import (
	"context"
	"fmt"
	"time"

	"github.com/KLSOBIG/mylife/apps/core/internal/domain"
)

type taskRepository interface {
	Get(ctx context.Context, taskID string) (domain.Task, error)
	UpdateStatus(ctx context.Context, task domain.Task, event domain.TaskEvent) error
	UndoLastTransition(ctx context.Context, taskID string, undoToken string) (domain.Task, error)
}

type TransitionResult struct {
	Task      domain.Task `json:"task"`
	UndoToken string      `json:"undoToken"`
}

type TaskService struct {
	repo taskRepository
}

func NewTaskService(repo taskRepository) *TaskService {
	return &TaskService{repo: repo}
}

func (s *TaskService) TransitionTask(ctx context.Context, taskID string, toStatus string) (*TransitionResult, error) {
	task, err := s.repo.Get(ctx, taskID)
	if err != nil {
		return nil, err
	}

	fromStatus := task.Status
	task.Status = toStatus
	task.Color = domain.DefaultStatusColors[toStatus]
	eventID := fmt.Sprintf("evt_%d", time.Now().UnixNano())

	if err := s.repo.UpdateStatus(ctx, task, domain.TaskEvent{
		ID:         eventID,
		TaskID:     task.ID,
		FromStatus: fromStatus,
		ToStatus:   toStatus,
		EventType:  "status_changed",
		OccurredAt: time.Now().UTC().Format(time.RFC3339),
	}); err != nil {
		return nil, err
	}

	return &TransitionResult{Task: task, UndoToken: eventID}, nil
}

func (s *TaskService) UndoTransition(ctx context.Context, taskID string, undoToken string) (*domain.Task, error) {
	task, err := s.repo.UndoLastTransition(ctx, taskID, undoToken)
	if err != nil {
		return nil, err
	}
	return &task, nil
}
