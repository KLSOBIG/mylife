package domain

type Task struct {
	ID          string  `json:"id"`
	WorkspaceID string  `json:"workspaceId"`
	ParentID    *string `json:"parentId,omitempty"`
	Title       string  `json:"title"`
	Status      string  `json:"status"`
	Color       string  `json:"color"`
	IsToday     bool    `json:"isToday"`
}
