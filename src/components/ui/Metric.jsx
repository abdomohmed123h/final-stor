export function Metric({ label, value, color }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "#111" }}>{value}</div>
    </div>
  );
}
