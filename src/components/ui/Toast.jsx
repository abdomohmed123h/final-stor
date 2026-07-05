export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1f2937",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: 10,
        fontSize: 13,
        zIndex: 9999,
        whiteSpace: "nowrap",
      }}
    >
      {msg}
    </div>
  );
}
