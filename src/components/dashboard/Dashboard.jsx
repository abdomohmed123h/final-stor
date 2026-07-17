import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Table, Badge } from "../ui";
import { fmt, todayStr, shortId } from "../../utils/format";
import {
  invoicesOnDate,
  invoiceRemaining,
  debtFor,
  expensesOnDate,
  getCashMovements,
  netCashForDate,
  cashRegisterBalance,
  debtAgingReport
} from "../../utils/calculations";
import { SalesTrendChart } from "./SalesTrendChart";
import { AnimatedMetric } from "./AnimatedMetric";
import { HoverMetricCard } from "../ui/HoverMetricCard";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" }
  })
};

function SectionCard({ title, icon, index, children, footnote, accent }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ y: -3 }}
      style={{ transition: "box-shadow 0.2s" }}
    >
      <div
        className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-shadow p-4"
        style={{ borderTop: `3px solid ${accent}` }}
      >
        <h3 className="text-sm font-bold mb-4 text-slate-700 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        {children}
        {footnote && (
          <div className="text-xs text-gray-400 mt-2">{footnote}</div>
        )}
      </div>
    </motion.div>
  );
}

export function Dashboard({
  products,
  invoices,
  customers,
  suppliers,
  expenses = [],
  treasuryWithdrawals = [],
  reservations = []
}) {
  const today = todayStr();

  const {
    totalSales,
    totalBuys,
    totalExpenses,
    netOfDay,
    treasuryBalance,
    lowStock,
    totalDebt,
    totalOwed,
    recentInvoices,
    movementsBreakdown,
    topDebtors
  } = useMemo(() => {
    const todaySales = invoicesOnDate(invoices, "sale", today);
    const todayBuys = invoicesOnDate(invoices, "purchase", today);
    const todayExpenses = expensesOnDate(expenses, today);

    const movements = getCashMovements(
      invoices,
      customers,
      suppliers,
      expenses,
      treasuryWithdrawals,
      [],
      reservations
    );

    // Breakdown by source for the treasury hover card.
    const bySource = {};
    movements.forEach((m) => {
      const key = m.direction === "in" ? "in" : "out";
      bySource[key] = (bySource[key] || 0) + m.amount;
    });

    return {
      totalSales: todaySales.reduce((s, i) => s + i.total, 0),
      totalBuys: todayBuys.reduce((s, i) => s + i.total, 0),
      totalExpenses: todayExpenses.reduce((s, e) => s + e.amount, 0),
      netOfDay: netCashForDate(movements, today),
      treasuryBalance: cashRegisterBalance(movements),
      lowStock: products.filter((p) => p.stock <= p.minStock),
      totalDebt: customers.reduce(
        (s, c) =>
          s + debtFor(invoices, c.id, c.payments || [], c.returns || []),
        0
      ),
      totalOwed: suppliers.reduce(
        (s, sp) =>
          s + debtFor(invoices, sp.id, sp.payments || [], sp.returns || []),
        0
      ),
      recentInvoices: [...invoices].reverse().slice(0, 10),
      movementsBreakdown: bySource,
      topDebtors: debtAgingReport(invoices, customers).slice(0, 4)
    };
  }, [
    products,
    invoices,
    customers,
    suppliers,
    expenses,
    treasuryWithdrawals,
    reservations,
    today
  ]);

  useEffect(() => {
    if (lowStock.length > 0) {
      toast.error(
        (t) => (
          <div dir="rtl" className="text-sm">
            <div className="font-bold mb-1.5">
              ⚠️ يوجد {lowStock.length} صنف منخفض المخزون
            </div>
            <ul className="max-h-40 overflow-y-auto space-y-1 pr-3 list-disc">
              {lowStock.map((p) => (
                <li key={p.id ?? p.name}>
                  <b>{p.name}</b>: {p.stock} {p.unit} (الحد الأدنى: {p.minStock}
                  )
                </li>
              ))}
            </ul>
          </div>
        ),
        { duration: 6000, id: "low-stock-alert" }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-bold text-slate-800 mb-4"
      >
        📊 لوحة التحكم —{" "}
        {new Date().toLocaleDateString("ar-EG", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </motion.h2>

      <div className="flex gap-3 flex-wrap mb-5">
        <AnimatedMetric
          label="مبيعات اليوم"
          value={totalSales}
          color="#16a34a"
        />
        <AnimatedMetric
          label="مشتريات اليوم"
          value={totalBuys}
          color="#dc2626"
        />
        <AnimatedMetric
          label="مصروفات اليوم"
          value={totalExpenses}
          color="#b91c1c"
        />
        <AnimatedMetric
          label="صافي اليوم"
          value={netOfDay}
          color={netOfDay >= 0 ? "#16a34a" : "#dc2626"}
        />

        <HoverMetricCard
          label="رصيد الخزينة"
          value={treasuryBalance}
          color="#0891b2"
          details={{
            title: "تفاصيل حركة الخزينة",
            rows: [
              {
                label: "إجمالي الداخل",
                value: fmt(movementsBreakdown.in || 0),
                color: "#16a34a"
              },
              {
                label: "إجمالي الخارج",
                value: fmt(movementsBreakdown.out || 0),
                color: "#dc2626"
              },
              {
                label: "الرصيد الحالي",
                value: fmt(treasuryBalance),
                color: "#0891b2"
              }
            ]
          }}
        />

        <HoverMetricCard
          label="ديون العملاء"
          value={totalDebt}
          color="#d97706"
          details={{
            title: "أعلى العملاء مديونية",
            rows: topDebtors.length
              ? topDebtors.map((d) => ({
                  label: d.name,
                  value: fmt(d.debt),
                  color: "#dc2626"
                }))
              : [{ label: "لا توجد ديون مستحقة", value: "🎉" }]
          }}
        />

        <AnimatedMetric
          label="مستحقات الموردين"
          value={totalOwed}
          color="#7c3aed"
        />
        <AnimatedMetric
          label="تنبيهات المخزن"
          value={lowStock.length}
          color={lowStock.length > 0 ? "#dc2626" : "#16a34a"}
          decimals={0}
          suffix=""
        />
      </div>

      <SectionCard
        title="اتجاه المبيعات والمشتريات"
        icon="📈"
        index={0}
        accent="#0891b2"
      >
        <SalesTrendChart invoices={invoices} />
      </SectionCard>

      {lowStock.length > 0 && (
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-red-100"
            animate={{ opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative">
            <h3 className="text-sm font-bold mb-3 text-red-700 flex items-center gap-2">
              <span className="text-lg">⚠️</span> أصناف منخفضة المخزون (
              {lowStock.length})
            </h3>
            <Table
              cols={["الصنف", "المخزون الحالي", "الحد الأدنى", "الوحدة"]}
              rows={lowStock.map((p) => [p.name, p.stock, p.minStock, p.unit])}
            />
          </div>
        </motion.div>
      )}

      <SectionCard title="آخر الفواتير" icon="📋" index={2} accent="#2563eb">
        <div className="[&_tbody_tr]:transition-colors [&_tbody_tr]:hover:bg-slate-50">
          <Table
            cols={[
              "رقم الفاتورة",
              "النوع",
              "التاريخ",
              "الجهة",
              "الإجمالي",
              "المبلغ المدفوع",
              "المتبقي"
            ]}
            rows={recentInvoices.map((inv) => [
              shortId(inv.id),
              inv.type === "sale" ? (
                <Badge color="blue">بيع</Badge>
              ) : (
                <Badge color="purple">شراء</Badge>
              ),
              new Date(inv.date).toLocaleDateString("ar-EG"),
              inv.partyName || "—",
              fmt(inv.total),
              fmt(inv.paid),
              <span
                className={
                  invoiceRemaining(inv) > 0 ? "text-red-600" : "text-green-600"
                }
              >
                {fmt(invoiceRemaining(inv))}
              </span>
            ])}
          />
        </div>
      </SectionCard>
    </div>
  );
}
