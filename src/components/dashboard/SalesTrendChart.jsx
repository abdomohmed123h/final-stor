// components/dashboard/SalesTrendChart.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { invoicesOnDate } from "../../utils/calculations";
import { localDateStr } from "../../utils/format";

export function SalesTrendChart({ invoices }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = localDateStr(d);
    const sales = invoicesOnDate(invoices, "sale", dateStr).reduce(
      (s, inv) => s + inv.total,
      0
    );
    const purchases = invoicesOnDate(invoices, "purchase", dateStr).reduce(
      (s, inv) => s + inv.total,
      0
    );
    return { date: dateStr.slice(5), مبيعات: sales, مشتريات: purchases };
  });

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-5">
      <h3 className="text-sm font-semibold mb-3">
        📈 المبيعات والمشتريات — آخر 7 أيام
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={days}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="مبيعات"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="مشتريات"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
