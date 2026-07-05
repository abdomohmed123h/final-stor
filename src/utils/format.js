// Formats a number as Egyptian Pound currency using Arabic-Egyptian locale.
export const fmt = (n) =>
  "ج.م " + Number(n || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ISO timestamp for "now" — used for invoice/payment/withdrawal dates.
// Must stay ISO (not localized) so it can be reliably parsed and sorted later.
export const now = () => new Date().toISOString();

// Today's date as an ISO "YYYY-MM-DD" string, used for date filtering.
export const todayStr = () => new Date().toISOString().slice(0, 10);

// Generates a short random id, good enough for local-only records.
export const uid = () => Math.random().toString(36).slice(2, 10);

// Shortens a record id to the last 6 characters for display, e.g. invoice numbers.
export const shortId = (id) => id.slice(-6).toUpperCase();