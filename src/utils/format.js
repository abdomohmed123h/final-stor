// Formats a number as Egyptian Pound currency using Arabic-Egyptian locale.
export const fmt = (n) =>
  "ج.م " + Number(n || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ISO timestamp for "now" — used for invoice/payment/withdrawal dates.
// Must stay ISO (not localized) so it can be reliably parsed and sorted later.
export const now = () => new Date().toISOString();

// Local YYYY-MM-DD for a given Date (defaults to today).
// IMPORTANT: uses local date parts, NOT toISOString(), which shifts by
// the timezone offset and can silently push the date back a day near
// midnight in UTC+2/+3 (Egypt).
export const localDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Today's date as a local "YYYY-MM-DD" string, used for date filtering.
export const todayStr = () => localDateStr(new Date());

// Displays any ISO date/timestamp string as a localized Arabic-Egyptian date,
// e.g. "٧ يوليو ٢٠٢٦". Use this everywhere instead of calling
// new Date(x).toLocaleDateString("ar-EG") directly in components.
export const displayDate = (isoStr, options = {}) =>
  new Date(isoStr).toLocaleDateString("ar-EG", options);

// Short "MM-DD" label, e.g. for chart axis ticks.
export const shortDateLabel = (dateStr) => dateStr.slice(5);

// Generates a short random id, good enough for local-only records.
export const uid = () => Math.random().toString(36).slice(2, 10);

// Shortens a record id to the last 6 characters for display, e.g. invoice numbers.
export const shortId = (id) => id.slice(-6).toUpperCase();