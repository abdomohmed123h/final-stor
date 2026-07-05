export function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}
