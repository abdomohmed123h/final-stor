import { Sidebar } from "./Sidebar";
import { Toast } from "../ui";

export function MainLayout({ currentUser, page, onNavigate, onLogout, toast, modal, children }) {
  return (
    <div
      dir="rtl"
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        background: "#f3f4f6",
        fontSize: 14,
      }}
    >
      <Sidebar currentUser={currentUser} page={page} onNavigate={onNavigate} onLogout={onLogout} />

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {children}
      </div>

      {modal}
      <Toast msg={toast} />
    </div>
  );
}
