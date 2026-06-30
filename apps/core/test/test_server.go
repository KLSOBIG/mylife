package test

import (
	"testing"

	httpapi "github.com/KLSOBIG/mylife/apps/core/internal/http"
	"github.com/KLSOBIG/mylife/apps/core/internal/store"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func newTestServer(t *testing.T) *gin.Engine {
	t.Helper()

	db, err := store.Open("file::memory:?cache=shared")
	require.NoError(t, err)

	t.Cleanup(func() {
		_ = db.Close()
	})

	return httpapi.NewRouter(store.NewTaskRepository(db))
}
