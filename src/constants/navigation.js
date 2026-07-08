// Sidebar navigation configuration. Each item is filtered by the current
// user's role before being rendered.
export const NAV_ITEMS = [
  { id: "dashboard", label: "لوحة التحكم", icon: "📊", roles: ["admin", "storekeeper", "salesman", "buyer"] },
  { id: "sales", label: "المبيعات", icon: "🧾", roles: ["admin", "salesman"] },
  { id: "purchases", label: "المشتريات", icon: "🛒", roles: ["admin", "buyer"] },
  { id: "inventory", label: "المخزن", icon: "📦", roles: ["admin", "storekeeper"] },
  { id: "customers", label: "العملاء", icon: "👥", roles: ["admin", "salesman"] },
  { id: "suppliers", label: "الموردون", icon: "🏭", roles: ["admin", "buyer"] },
  { id: "invoices", label: "الفواتير", icon: "📋", roles: ["admin", "salesman", "buyer"] },
  { id: "products", label: "الأصناف", icon: "🧱", roles: ["admin", "storekeeper"] },
  { id: "users", label: "المستخدمون", icon: "🔑", roles: ["admin"] },
  { id: "reports", label: "التقارير", icon: "📈", roles: ["admin"] },
  { id: "treasury", label: "الخزينة", icon: "💰", roles: ["admin"] },
  { id: "expenses", label: "المصاريف", icon: "💰", roles: ["admin", "salesman"] },
  { id: "analytics", label: "التحليلات", icon: "🧠", roles: ["admin"] },
  { id: "transportation", label: "النقل", icon: "🚚", roles: ["admin", "salesman"]
    
   }

];