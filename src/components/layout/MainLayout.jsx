import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Toast } from "../ui";

export function MainLayout({
  currentUser,
  page,
  onNavigate,
  onLogout,
  toast,
  modal,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      dir="rtl"
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        background: "#f3f4f6",
        fontSize: 14
      }}
    >
      <Sidebar
        currentUser={currentUser}
        page={page}
        onNavigate={onNavigate}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only top bar with hamburger trigger */}
        <div
          className="md:hidden flex items-center gap-3 px-3 py-2.5 sticky top-0 z-30"
          style={{ background: "#1e293b" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-2xl leading-none px-1"
          >
            ☰
          </button>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            🏗️ البنا للمواد
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 md:p-5">{children}</div>
      </div>

      {modal}
      <Toast msg={toast} />
    </div>
  );
}
