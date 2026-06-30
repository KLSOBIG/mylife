package httpapi

import (
	"context"
	"net/http"

	"github.com/KLSOBIG/mylife/apps/core/internal/domain"
	"github.com/gin-gonic/gin"
)

type taskRepository interface {
	Create(ctx context.Context, task domain.Task) (domain.Task, error)
	List(ctx context.Context, status string, today bool) ([]domain.Task, error)
	Get(ctx context.Context, taskID string) (domain.Task, error)
	UpdateStatus(ctx context.Context, task domain.Task, event domain.TaskEvent) error
	UndoLastTransition(ctx context.Context, taskID string, undoToken string) (domain.Task, error)
}

type TaskHandler struct {
	repo taskRepository
}

func NewTaskHandler(repo taskRepository) *TaskHandler {
	return &TaskHandler{repo: repo}
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
	var in domain.Task
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.repo.Create(c.Request.Context(), in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, task)
}

func (h *TaskHandler) ListTasks(c *gin.Context) {
	status := c.Query("status")
	today := c.Query("today") == "true"

	tasks, err := h.repo.List(c.Request.Context(), status, today)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": tasks})
}
