package markdown

import "strings"

type CheckboxTask struct {
	Title  string
	Status string
}

func ParseCheckboxTasks(input string) []CheckboxTask {
	lines := strings.Split(input, "\n")
	items := make([]CheckboxTask, 0)
	for _, line := range lines {
		switch {
		case strings.HasPrefix(line, "- [ ] "):
			items = append(items, CheckboxTask{
				Title:  strings.TrimPrefix(line, "- [ ] "),
				Status: "not_started",
			})
		case strings.HasPrefix(line, "- [x] "):
			items = append(items, CheckboxTask{
				Title:  strings.TrimPrefix(line, "- [x] "),
				Status: "completed",
			})
		}
	}
	return items
}
