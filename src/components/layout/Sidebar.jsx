import { NAV_ITEMS } from "../../constants/navigation";
import { ROLES } from "../../constants/roles";
import { Btn } from "../ui";

export function Sidebar({ currentUser, page, onNavigate, onLogout }) {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role));

  return (
    <div style={{ width: 200, background: "#1e293b", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "16px 12px", borderBottom: "1px solid #334155" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>🏗️ البنا للمواد</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
          {currentUser.name} — {ROLES[currentUser.role]}
        </div>
      </div>

      <nav style={{ flex: 1, padding: "8px 0" }}>
        {visibleItems.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: "block",
                width: active ? "calc(100% - 8px)" : "100%",
                textAlign: "right",
                padding: "10px 14px",
                background: active ? "#2563eb" : "none",
                border: "none",
                color: active ? "#fff" : "#cbd5e1",
                fontSize: 13,
                cursor: "pointer",
                borderRadius: active ? 8 : 0,
                margin: active ? "1px 4px" : 0,
              }}
            >
              {item.icon} {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 12, borderTop: "1px solid #334155" }}>
        <Btn color="gray" onClick={onLogout}>
          🚪 خروج
        </Btn>
      </div>
    </div>
  );
}
