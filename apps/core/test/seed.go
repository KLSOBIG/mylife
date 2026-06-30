package test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func seedTask(t *testing.T, server *gin.Engine, title string) string {
	t.Helper()

	body := strings.NewReader(`{"workspaceId":"ws_default","title":"` + title + `","status":"not_started","isToday":true}`)
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", body)
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	server.ServeHTTP(resp, req)
	require.Equal(t, http.StatusCreated, resp.Code)

	var task struct {
		ID string `json:"id"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &task))
	require.NotEmpty(t, task.ID)

	return task.ID
}
