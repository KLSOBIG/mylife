package store

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/KLSOBIG/mylife/apps/core/internal/domain"
)

type TaskRepository struct {
	db *sql.DB
}

func NewTaskRepository(db *sql.DB) *TaskRepository {
	return &TaskRepository{db: db}
}

func (r *TaskRepository) Create(ctx context.Context, task domain.Task) (domain.Task, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	if task.ID == "" {
		task.ID = fmt.Sprintf("task_%d", time.Now().UnixNano())
	}
	if task.Color == "" {
		task.Color = "slate"
	}

	_, err := r.db.ExecContext(
		ctx,
		`INSERT INTO tasks (id, workspace_id, parent_id, title, status, color, is_today, sort_order, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
		task.ID,
		task.WorkspaceID,
		task.ParentID,
		task.Title,
		task.Status,
		task.Color,
		boolToInt(task.IsToday),
		now,
		now,
	)
	if err != nil {
		return domain.Task{}, err
	}

	return task, nil
}

func (r *TaskRepository) List(ctx context.Context, status string, today bool) ([]domain.Task, error) {
	query := `SELECT id, workspace_id, parent_id, title, status, color, is_today FROM tasks WHERE status = ?`
	args := []any{status}
	if today {
		query += ` AND is_today = 1`
	}
	query += ` ORDER BY created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.Task, 0)
	for rows.Next() {
		var task domain.Task
		var isToday int
		if err := rows.Scan(&task.ID, &task.WorkspaceID, &task.ParentID, &task.Title, &task.Status, &task.Color, &isToday); err != nil {
			return nil, err
		}
		task.IsToday = isToday == 1
		items = append(items, task)
	}

	return items, rows.Err()
}

func (r *TaskRepository) Get(ctx context.Context, taskID string) (domain.Task, error) {
	row := r.db.QueryRowContext(ctx, `SELECT id, workspace_id, parent_id, title, status, color, is_today FROM tasks WHERE id = ?`, taskID)

	var task domain.Task
	var isToday int
	if err := row.Scan(&task.ID, &task.WorkspaceID, &task.ParentID, &task.Title, &task.Status, &task.Color, &isToday); err != nil {
		return domain.Task{}, err
	}

	task.IsToday = isToday == 1
	return task, nil
}

func (r *TaskRepository) UpdateStatus(ctx context.Context, task domain.Task, event domain.TaskEvent) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(
		ctx,
		`UPDATE tasks SET status = ?, color = ?, updated_at = ? WHERE id = ?`,
		task.Status,
		task.Color,
		time.Now().UTC().Format(time.RFC3339),
		task.ID,
	); err != nil {
		_ = tx.Rollback()
		return err
	}

	if _, err := tx.ExecContext(
		ctx,
		`INSERT INTO task_events (id, task_id, from_status, to_status, event_type, occurred_at, undo_of_event_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		event.ID,
		event.TaskID,
		event.FromStatus,
		event.ToStatus,
		event.EventType,
		event.OccurredAt,
		event.UndoOfEventID,
	); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}

func (r *TaskRepository) UndoLastTransition(ctx context.Context, taskID string, undoToken string) (domain.Task, error) {
	row := r.db.QueryRowContext(
		ctx,
		`SELECT from_status, to_status FROM task_events WHERE id = ? AND task_id = ?`,
		undoToken,
		taskID,
	)

	var fromStatus string
	var toStatus string
	if err := row.Scan(&fromStatus, &toStatus); err != nil {
		return domain.Task{}, err
	}

	task, err := r.Get(ctx, taskID)
	if err != nil {
		return domain.Task{}, err
	}

	task.Status = fromStatus
	task.Color = domain.DefaultStatusColors[fromStatus]
	now := time.Now().UTC().Format(time.RFC3339)
	undoOf := undoToken
	event := domain.TaskEvent{
		ID:            fmt.Sprintf("evt_%d", time.Now().UnixNano()),
		TaskID:        task.ID,
		FromStatus:    toStatus,
		ToStatus:      fromStatus,
		EventType:     "undo_status_change",
		OccurredAt:    now,
		UndoOfEventID: &undoOf,
	}

	if err := r.UpdateStatus(ctx, task, event); err != nil {
		return domain.Task{}, err
	}

	return task, nil
}

func boolToInt(v bool) int {
	if v {
		return 1
	}
	return 0
}
