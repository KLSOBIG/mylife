package reminder

import "time"

type Rule struct {
	Kind     string
	Weekdays []time.Weekday
}

func NextOccurrence(rule Rule, from time.Time) time.Time {
	switch rule.Kind {
	case "weekly":
		for i := 1; i <= 7; i++ {
			next := from.AddDate(0, 0, i)
			for _, weekday := range rule.Weekdays {
				if next.Weekday() == weekday {
					return next
				}
			}
		}
	case "daily":
		return from.AddDate(0, 0, 1)
	}

	return from
}
