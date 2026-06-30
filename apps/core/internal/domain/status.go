package domain

var DefaultStatusColors = map[string]string{
	"not_started": "slate",
	"in_progress": "amber",
	"completed":   "green",
	"abandoned":   "rose",
}

var NextStatus = map[string]string{
	"not_started": "in_progress",
	"in_progress": "completed",
}
