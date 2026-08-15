export default function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        {title && <h3 style={{ marginBottom: 18 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
