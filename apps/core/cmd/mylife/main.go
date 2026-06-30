package main

import (
	"log"

	httpapi "github.com/KLSOBIG/mylife/apps/core/internal/http"
	"github.com/KLSOBIG/mylife/apps/core/internal/store"
)

func main() {
	db, err := store.Open("file:mylife.db?_pragma=foreign_keys(1)")
	if err != nil {
		log.Fatal(err)
	}

	repo := store.NewTaskRepository(db)
	router := httpapi.NewRouter(repo)
	if err := router.Run("127.0.0.1:8080"); err != nil {
		log.Fatal(err)
	}
}
