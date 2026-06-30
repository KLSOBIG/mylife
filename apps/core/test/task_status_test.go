package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestTransitionTaskCreatesEventAndUndo(t *testing.T) {
	server := newTestServer(t)
	taskID := seedTask(t, server, "重构任务时间轴存储")

	req := httptest.NewRequest(http.MethodPost, "/api/tasks/"+taskID+"/transition", strings.NewReader(`{"toStatus":"completed"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	server.ServeHTTP(resp, req)
	require.Equal(t, http.StatusOK, resp.Code)

	var transition map[string]any
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &transition))
	undoToken, ok := transition["undoToken"].(string)
	require.True(t, ok)
	require.NotEmpty(t, undoToken)

	undoBody := bytes.NewBufferString(`{"undoToken":"` + undoToken + `"}`)
	undoReq := httptest.NewRequest(http.MethodPost, "/api/tasks/"+taskID+"/undo", undoBody)
	undoReq.Header.Set("Content-Type", "application/json")
	undoResp := httptest.NewRecorder()
	server.ServeHTTP(undoResp, undoReq)
	require.Equal(t, http.StatusOK, undoResp.Code)
	require.Contains(t, undoResp.Body.String(), `"status":"not_started"`)
}
