export function Table({ cols, rows, empty = "لا توجد بيانات" }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            {cols.map((col, i) => (
              <th
                key={i}
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  color: "#6b7280",
                  fontWeight: 500,
                  borderBottom: "1px solid #e5e7eb",
                  whiteSpace: "nowrap",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: "8px 10px", color: "#111" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
