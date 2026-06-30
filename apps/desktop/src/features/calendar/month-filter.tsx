const days = Array.from({ length: 7 }, (_, index) => index + 24);

export function MonthFilter() {
  return (
    <section>
      <h2>日历</h2>
      <div className="calendar-grid">
        {days.map((day) => (
          <button key={day} type="button">
            {day}
          </button>
        ))}
      </div>
    </section>
  );
}
