package httpapi

import (
	"github.com/KLSOBIG/mylife/apps/core/internal/service"
	"github.com/gin-gonic/gin"
)

func NewRouter(repo taskRepository) *gin.Engine {
	router := gin.New()
	handler := NewTaskHandler(repo)
	statusHandler := NewStatusHandler(service.NewTaskService(repo))
	router.POST("/api/tasks", handler.CreateTask)
	router.GET("/api/tasks", handler.ListTasks)
	router.POST("/api/tasks/:taskID/transition", statusHandler.Transition)
	router.POST("/api/tasks/:taskID/undo", statusHandler.Undo)
	return router
}
