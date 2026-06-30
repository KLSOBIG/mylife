package domain

type TaskEvent struct {
	ID            string
	TaskID        string
	FromStatus    string
	ToStatus      string
	EventType     string
	OccurredAt    string
	UndoOfEventID *string
}
