import { useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { Card, Badge, Metric, Table, Btn } from "../ui";
import { fmt, todayStr, shortId } from "../../utils/format";
import {
  invoicesOnDate,
  invoiceRemaining,
  debtFor,
  expensesOnDate,
  getCashMovements,
  netCashForDate,
  cashRegisterBalance
} from "../../utils/calculations";
import { SalesTrendChart } from "./SalesTrendChart";
import { AnimatedMetric } from "./AnimatedMetric";

export function Dashboard({
  products,
  invoices,
  customers,
  suppliers,
  expenses = [],
  treasuryWithdrawals = []
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
    recentInvoices
  } = useMemo(() => {
    const todaySales = invoicesOnDate(invoices, "sale", today);
    const todayBuys = invoicesOnDate(invoices, "purchase", today);
    const todayExpenses = expensesOnDate(expenses, today);

    const movements = getCashMovements(
      invoices,
      customers,
      suppliers,
      expenses,
      treasuryWithdrawals
    );

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
      recentInvoices: [...invoices].reverse().slice(0, 10)
    };
  }, [
    products,
    invoices,
    customers,
    suppliers,
    expenses,
    treasuryWithdrawals,
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
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        📊 لوحة التحكم —{" "}
        {new Date().toLocaleDateString("ar-EG", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </h2>

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
        <AnimatedMetric
          label="رصيد الخزينة"
          value={treasuryBalance}
          color="#0891b2"
        />
        <AnimatedMetric
          label="ديون العملاء"
          value={totalDebt}
          color="#d97706"
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
      <SalesTrendChart invoices={invoices} />

      {lowStock.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3 text-red-600">
            ⚠️ أصناف منخفضة المخزون
          </h3>
          <Table
            cols={["الصنف", "المخزون الحالي", "الحد الأدنى", "الوحدة"]}
            rows={lowStock.map((p) => [p.name, p.stock, p.minStock, p.unit])}
          />
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold mb-3">📋 آخر الفواتير</h3>
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
      </Card>
    </div>
  );
}
