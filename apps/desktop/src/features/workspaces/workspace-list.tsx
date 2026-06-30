const workspaces = ["个人工作", "学习项目", "生活杂项"];

export function WorkspaceList() {
  return (
    <section>
      <h2>工作空间</h2>
      <ul>
        {workspaces.map((workspace) => (
          <li key={workspace}>{workspace}</li>
        ))}
      </ul>
    </section>
  );
}
