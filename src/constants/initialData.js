// Default seed data used the first time the app runs (before anything is
// persisted to localStorage).
export const INIT_USERS = [
  { id: "u1", name: "المدير", username: "admin", password: "admin123", role: "admin" },
  { id: "u2", name: "أمين المخزن", username: "store", password: "store123", role: "storekeeper" },
  { id: "u3", name: "مندوب المبيعات", username: "sales", password: "sales123", role: "salesman" },
  { id: "u4", name: "مسؤول الشراء", username: "buyer", password: "buyer123", role: "buyer" },
];

export const INIT_PRODUCTS = [
  { id: "p1", name: "أسمنت", unit: "شيكارة", stock: 500, buyPrice: 95, sellPrice: 120, minStock: 50 },
  { id: "p2", name: "حديد تسليح", unit: "طن", stock: 20, buyPrice: 24000, sellPrice: 28000, minStock: 3 },
  { id: "p3", name: "طوب خرساني", unit: "قطعة", stock: 1200, buyPrice: 5.5, sellPrice: 8, minStock: 200 },
  { id: "p4", name: "جبس", unit: "شيكارة", stock: 80, buyPrice: 32, sellPrice: 45, minStock: 20 },
  { id: "p5", name: "أسمنت أبيض", unit: "شيكارة", stock: 60, buyPrice: 145, sellPrice: 180, minStock: 15 },
];

// Demo credentials shown on the login screen.
export const DEMO_CREDENTIALS = [
  ["admin", "admin123", "مدير"],
  ["store", "store123", "أمين مخزن"],
  ["sales", "sales123", "مبيعات"],
  ["buyer", "buyer123", "شراء"],
];
