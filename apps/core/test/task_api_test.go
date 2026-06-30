package test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCreateTaskAndListByStatus(t *testing.T) {
	server := newTestServer(t)

	body := strings.NewReader(`{"workspaceId":"ws_default","title":"写计划","status":"not_started","isToday":true}`)
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", body)
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	server.ServeHTTP(resp, req)
	require.Equal(t, http.StatusCreated, resp.Code)

	listReq := httptest.NewRequest(http.MethodGet, "/api/tasks?status=not_started&today=true", nil)
	listResp := httptest.NewRecorder()
	server.ServeHTTP(listResp, listReq)

	require.Equal(t, http.StatusOK, listResp.Code)
	require.Contains(t, listResp.Body.String(), "写计划")
}
