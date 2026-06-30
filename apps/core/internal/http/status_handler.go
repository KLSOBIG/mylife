package httpapi

import (
	"net/http"

	"github.com/KLSOBIG/mylife/apps/core/internal/service"
	"github.com/gin-gonic/gin"
)

type StatusHandler struct {
	service *service.TaskService
}

type transitionInput struct {
	ToStatus string `json:"toStatus"`
}

type undoInput struct {
	UndoToken string `json:"undoToken"`
}

func NewStatusHandler(service *service.TaskService) *StatusHandler {
	return &StatusHandler{service: service}
}

func (h *StatusHandler) Transition(c *gin.Context) {
	var in transitionInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.TransitionTask(c.Request.Context(), c.Param("taskID"), in.ToStatus)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *StatusHandler) Undo(c *gin.Context) {
	var in undoInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.service.UndoTransition(c.Request.Context(), c.Param("taskID"), in.UndoToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, task)
}
