export function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</label>}
      <select
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "inherit",
          background: "#fff",
          color: "#111",
          boxSizing: "border-box",
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
