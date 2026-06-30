export function UndoToast({
  message,
  onUndo
}: {
  message: string;
  onUndo: () => void;
}) {
  return (
    <aside role="status" className="undo-toast">
      <div className="undo-toast__title">{message}</div>
      <div className="undo-toast__row">
        <span>5 秒内可撤销</span>
        <button type="button" onClick={onUndo}>
          撤销
        </button>
      </div>
    </aside>
  );
}
