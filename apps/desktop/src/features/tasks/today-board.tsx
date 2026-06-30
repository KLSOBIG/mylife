const groups = ["未开始", "进行中", "已完成", "废弃"];

export function TodayBoard() {
  return (
    <section className="today-board">
      <header className="today-header">
        <h1>今天</h1>
        <button type="button">快速新增 +</button>
      </header>
      <div className="status-grid">
        {groups.map((group) => (
          <article key={group} className="status-column">
            <h2>{group}</h2>
          </article>
        ))}
      </div>
    </section>
  );
}
