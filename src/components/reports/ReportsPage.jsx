import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { Table, Badge, Metric, Input, Select, Btn } from "../ui";
import { HoverMetricCard } from "../ui/HoverMetricCard";
import { fmt, todayStr, localDateStr } from "../../utils/format";
import {
  exportInvoicesToCSV,
  exportExpensesToCSV
} from "../../utils/csvExport";
import {
  getCashMovements,
  cashRegisterBalance,
  dailyCashHistory,
  localDateOf,
  monthlyNetProfitTrend,
  totalInventoryValue
} from "../../utils/calculations";
import { depositCategoryLabel } from "../../constants/treasuryCategories";
import { AnimatedMetric } from "../dashboard/AnimatedMetric";

const QUICK_FILTERS = [
  {
    key: "today",
    label: "اليوم",
    getRange: () => {
      const t = todayStr();
      return { from: t, to: t };
    }
  },
  {
    key: "week",
    label: "آخر 7 أيام",
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 6);
      return { from: localDateStr(from), to: localDateStr(to) };
    }
  },
  {
    key: "month",
    label: "هذا الشهر",
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: localDateStr(from), to: todayStr() };
    }
  },
  {
    key: "all",
    label: "كل الفترة",
    getRange: () => ({ from: "0000-01-01", to: "9999-12-31" })
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" }
  })
};

function SectionCard({
  title,
  icon,
  index,
  children,
  footnote,
  accent,
  headerExtra
}) {
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
        className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-shadow p-4 mb-4"
        style={{ borderTop: `3px solid ${accent}` }}
      >
        <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span>{icon}</span> {title}
          </h3>
          {headerExtra}
        </div>
        {children}
        {footnote && (
          <div className="text-xs text-gray-400 mt-2">{footnote}</div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ text }) {
  return <div className="text-center text-gray-400 text-sm py-8">{text}</div>;
}

export function ReportsPage({
  invoices,
  products = [],
  customers = [],
  suppliers = [],
  expenses = [],
  transportPersons = [],
  treasuryWithdrawals = [],
  treasuryDeposits = [],
  reservations = [],
  currentUser,
  showToast,
  setModal
}) {
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [type, setType] = useState("all");
  const [activeQuickFilter, setActiveQuickFilter] = useState("today");
  const [transportFilter, setTransportFilter] = useState("all");

  const inventory = useMemo(() => totalInventoryValue(products), [products]);

  const applyQuickFilter = (filter) => {
    const { from: f, to: t } = filter.getRange();
    setFrom(f);
    setTo(t);
    setActiveQuickFilter(filter.key);
  };

  const handleManualDate = (setter) => (e) => {
    setter(e.target.value);
    setActiveQuickFilter(null);
  };

  const filtered = useMemo(
    () =>
      invoices.filter((i) => {
        const date = localDateOf(i.date);
        return (
          date >= from && date <= to && (type === "all" || i.type === type)
        );
      }),
    [invoices, from, to, type]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const date = localDateOf(e.date);
        return date >= from && date <= to;
      }),
    [expenses, from, to]
  );

  const filteredReturns = useMemo(() => {
    const all = [];
    customers.forEach((c) => {
      (c.returns || []).forEach((r) => {
        const date = localDateOf(r.date);
        if (date >= from && date <= to) {
          all.push({ ...r, customerName: c.name });
        }
      });
    });
    return all;
  }, [customers, from, to]);

  const filteredTransportJobs = useMemo(() => {
    return filtered.filter(
      (i) =>
        i.type === "sale" &&
        i.transportId &&
        (transportFilter === "all" || i.transportId === transportFilter)
    );
  }, [filtered, transportFilter]);

  const transportFeesInRange = filteredTransportJobs.reduce(
    (s, i) => s + (i.transportFee || 0),
    0
  );

  const transportCollectedInRange = filteredTransportJobs
    .filter((i) => i.transportFeePaid)
    .reduce((s, i) => s + (i.transportFee || 0), 0);

  const totalSalesRaw = filtered
    .filter((i) => i.type === "sale")
    .reduce((s, i) => s + (i.itemsTotal ?? i.total), 0);

  const totalBuys = filtered
    .filter((i) => i.type === "purchase")
    .reduce((s, i) => s + i.total, 0);

  const totalPaid = filtered.reduce((s, i) => s + i.paid, 0);
  const totalRemaining = filtered.reduce((s, i) => s + (i.total - i.paid), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const { totalReturnsAmount, returnsCost } = useMemo(() => {
    let amount = 0;
    let cost = 0;
    filteredReturns.forEach((r) => {
      amount += r.amount || 0;
      const product = products.find((p) => p.id === r.productId);
      cost += (product?.buyPrice || 0) * (r.qty || 0);
    });
    return { totalReturnsAmount: amount, returnsCost: cost };
  }, [filteredReturns, products]);

  const totalSales = totalSalesRaw - totalReturnsAmount;

  const costOfGoodsSoldRaw = useMemo(() => {
    const saleInvoices = filtered.filter((i) => i.type === "sale");
    let cost = 0;
    saleInvoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        cost += (product?.buyPrice || 0) * (parseFloat(item.qty) || 0);
      });
    });
    return cost;
  }, [filtered, products]);

  const costOfGoodsSold = costOfGoodsSoldRaw - returnsCost;
  const netProfit = totalSales - costOfGoodsSold - totalExpenses;

  const netProfitTrend = useMemo(
    () => monthlyNetProfitTrend(invoices, products, expenses, 6),
    [invoices, products, expenses]
  );

  const { treasuryBalance, historyInRange, movementsBreakdown } =
    useMemo(() => {
      const movements = getCashMovements(
        invoices,
        customers,
        suppliers,
        expenses,
        treasuryWithdrawals,
        treasuryDeposits,
        reservations
      );
      const fullHistory = dailyCashHistory(movements);
      const balance = cashRegisterBalance(movements);
      const inRange = fullHistory.filter((h) => h.date >= from && h.date <= to);

      const bySource = {};
      movements.forEach((m) => {
        const key = m.direction === "in" ? "in" : "out";
        bySource[key] = (bySource[key] || 0) + m.amount;
      });

      return {
        treasuryBalance: balance,
        historyInRange: inRange,
        movementsBreakdown: bySource
      };
    }, [
      invoices,
      customers,
      suppliers,
      expenses,
      treasuryWithdrawals,
      treasuryDeposits,
      reservations,
      from,
      to
    ]);

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-bold text-slate-800 mb-5"
      >
        📈 التقارير
      </motion.h2>

      <SectionCard title="فلاتر الفترة" icon="🗓️" index={0} accent="#2563eb">
        <div className="flex gap-2 flex-wrap mb-4">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => applyQuickFilter(f)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                border:
                  activeQuickFilter === f.key
                    ? "1px solid #2563eb"
                    : "1px solid #d1d5db",
                background: activeQuickFilter === f.key ? "#2563eb" : "#fff",
                color: activeQuickFilter === f.key ? "#fff" : "#374151"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2.5 items-end">
          <Input
            label="من تاريخ"
            type="date"
            value={from}
            onChange={handleManualDate(setFrom)}
          />
          <Input
            label="إلى تاريخ"
            type="date"
            value={to}
            onChange={handleManualDate(setTo)}
          />
          <Select
            label="النوع"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="sale">مبيعات</option>
            <option value="purchase">مشتريات</option>
          </Select>
          <Btn
            color="green"
            onClick={() => exportInvoicesToCSV(filtered, from, to)}
          >
            ⬇️ تصدير الفواتير CSV
          </Btn>
        </div>
      </SectionCard>

      <div className="flex gap-3 flex-wrap mb-5">
        <HoverMetricCard
          label="إجمالي قيمة المخزون (تكلفة)"
          value={inventory.costValue}
          color="#0891b2"
          details={{
            title: "أعلى 4 أصناف من حيث القيمة",
            rows: inventory.breakdown.slice(0, 4).map((p) => ({
              label: p.name,
              value: fmt(p.costValue),
              color: "#0e7490"
            }))
          }}
        />

        <AnimatedMetric
          label="إجمالي المبيعات (قبل المرتجعات)"
          value={totalSalesRaw}
          color="#16a34a"
        />
        <AnimatedMetric
          label="إجمالي المرتجعات"
          value={totalReturnsAmount}
          color="#ea580c"
        />
        <AnimatedMetric
          label="صافي المبيعات"
          value={totalSales}
          color="#16a34a"
        />
        <AnimatedMetric
          label="إجمالي المشتريات"
          value={totalBuys}
          color="#dc2626"
        />
        <AnimatedMetric
          label="تكلفة البضاعة المباعة"
          value={costOfGoodsSold}
          color="#7c3aed"
        />
        <AnimatedMetric
          label="إجمالي المصروفات"
          value={totalExpenses}
          color="#b91c1c"
        />
        <AnimatedMetric
          label="صافي الربح"
          value={netProfit}
          color={netProfit >= 0 ? "#16a34a" : "#dc2626"}
        />
        <AnimatedMetric
          label="إجمالي المحصل"
          value={totalPaid}
          color="#2563eb"
        />
        <AnimatedMetric
          label="إجمالي المتبقي"
          value={totalRemaining}
          color="#d97706"
        />
        <AnimatedMetric
          label="عدد الفواتير"
          value={filtered.length}
          decimals={0}
          suffix=""
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5"
      >
        ⚠️ ملاحظة: صافي الربح يُحسب باستخدام سعر الشراء الحالي للأصناف، وليس
        السعر الفعلي وقت الشراء. إذا تغيرت أسعار الشراء لاحقاً (بسبب التضخم)،
        فقد يختلف الرقم الفعلي عن هذا التقدير. كما تم خصم المرتجعات من إجمالي
        المبيعات وتكلفة البضاعة المباعة لهذه الفترة، وأجرة النقل مستبعدة من صافي
        المبيعات لأنها تُحسب في تقرير النقل بشكل منفصل.
      </motion.div>

      <SectionCard
        title="الخزينة"
        icon="💰"
        index={1}
        accent="#0891b2"
        headerExtra={
          <span
            className="text-base font-bold"
            style={{ color: treasuryBalance >= 0 ? "#0891b2" : "#dc2626" }}
          >
            رصيد الخزينة الحالي: {fmt(treasuryBalance)}
          </span>
        }
      >
        <div className="text-xs text-gray-500 mb-3">
          الرصيد الحالي يمثل صافي النقدية الفعلية في المحل من كل عمليات القبض
          والدفع (مبيعات، مشتريات، دفعات، استرجاعات، مصروفات، سحوبات، إيداعات،
          دفعات حجوزات) — وليس مرتبطاً بتاريخ معين. المرتجعات لا تؤثر على
          الخزينة لأنها رصيد دائن للعميل وليست نقدية فعلية. لإدارة السحب
          والإيداع من الخزينة، اذهب لصفحة "الخزينة" من القائمة الجانبية.
        </div>

        <div className="flex gap-4 text-xs mb-4">
          <span className="text-gray-500">
            إجمالي الداخل:{" "}
            <b className="text-green-600">{fmt(movementsBreakdown.in || 0)}</b>
          </span>
          <span className="text-gray-500">
            إجمالي الخارج:{" "}
            <b className="text-red-600">{fmt(movementsBreakdown.out || 0)}</b>
          </span>
        </div>

        <h4 className="text-xs font-semibold mb-2 text-slate-600">
          السجل اليومي للخزينة
        </h4>
        {historyInRange.length === 0 ? (
          <EmptyState text="لا توجد حركات نقدية في هذه الفترة" />
        ) : (
          <Table
            cols={["التاريخ", "صافي اليوم", "رصيد الخزينة في نهاية اليوم"]}
            rows={[...historyInRange]
              .reverse()
              .map((h) => [
                h.date,
                <span
                  style={{
                    color: h.netOfDay >= 0 ? "#16a34a" : "#dc2626",
                    fontWeight: 600
                  }}
                >
                  {fmt(h.netOfDay)}
                </span>,
                <span style={{ fontWeight: 700 }}>
                  {fmt(h.balanceEndOfDay)}
                </span>
              ])}
          />
        )}

        {treasuryWithdrawals.length > 0 && (
          <>
            <h4 className="text-xs font-semibold mt-4 mb-2 text-slate-600">
              سجل سحوبات الخزينة
            </h4>
            <Table
              cols={["التاريخ", "المبلغ", "السبب", "بواسطة"]}
              rows={[...treasuryWithdrawals]
                .filter(
                  (w) =>
                    localDateOf(w.date) >= from && localDateOf(w.date) <= to
                )
                .reverse()
                .map((w) => [
                  new Date(w.date).toLocaleDateString("ar-EG"),
                  <span style={{ color: "#dc2626", fontWeight: 600 }}>
                    {fmt(w.amount)}
                  </span>,
                  w.note || "—",
                  w.by || "—"
                ])}
            />
          </>
        )}

        {treasuryDeposits.length > 0 && (
          <>
            <h4 className="text-xs font-semibold mt-4 mb-2 text-slate-600">
              سجل إيداعات الخزينة
            </h4>
            <Table
              cols={["التاريخ", "المبلغ", "النوع", "ملاحظة", "بواسطة"]}
              rows={[...treasuryDeposits]
                .filter(
                  (d) =>
                    localDateOf(d.date) >= from && localDateOf(d.date) <= to
                )
                .reverse()
                .map((d) => [
                  new Date(d.date).toLocaleDateString("ar-EG"),
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    {fmt(d.amount)}
                  </span>,
                  depositCategoryLabel(d.category),
                  d.note || "—",
                  d.by || "—"
                ])}
            />
          </>
        )}
      </SectionCard>

      <SectionCard title="الفواتير" icon="📋" index={2} accent="#2563eb">
        <div className="[&_tbody_tr]:transition-colors [&_tbody_tr]:hover:bg-slate-50">
          <Table
            cols={[
              "رقم الفاتورة",
              "النوع",
              "التاريخ",
              "الجهة",
              "الإجمالي",
              "مدفوع",
              "متبقي"
            ]}
            rows={[...filtered]
              .reverse()
              .map((i) => [
                i.id.slice(-6).toUpperCase(),
                i.type === "sale" ? (
                  <Badge color="blue">بيع</Badge>
                ) : (
                  <Badge color="purple">شراء</Badge>
                ),
                localDateOf(i.date),
                i.partyName || "—",
                fmt(i.total),
                fmt(i.paid),
                <span
                  style={{
                    color: i.total - i.paid > 0 ? "#dc2626" : "#16a34a"
                  }}
                >
                  {fmt(i.total - i.paid)}
                </span>
              ])}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="المبيعات وصافي الربح — آخر 6 أشهر"
        icon="📊"
        index={3}
        accent="#16a34a"
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={netProfitTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" fontSize={11} stroke="#94a3b8" />
            <YAxis fontSize={11} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 12
              }}
              formatter={(v) => fmt(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="المبيعات"
              stroke="#16a34a"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="netProfit"
              name="صافي الربح"
              stroke="#7c3aed"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard
        title={`المرتجعات (${filteredReturns.length}) — إجمالي ${fmt(totalReturnsAmount)}`}
        icon="↩️"
        index={4}
        accent="#ea580c"
      >
        {filteredReturns.length === 0 ? (
          <EmptyState text="لا توجد مرتجعات في هذه الفترة" />
        ) : (
          <Table
            cols={["التاريخ", "العميل", "الصنف", "الكمية", "المبلغ", "ملاحظة"]}
            rows={[...filteredReturns]
              .reverse()
              .map((r) => [
                new Date(r.date).toLocaleDateString("ar-EG"),
                r.customerName,
                r.productName,
                r.qty,
                <span style={{ color: "#ea580c", fontWeight: 600 }}>
                  {fmt(r.amount)}
                </span>,
                r.note || "—"
              ])}
          />
        )}
      </SectionCard>

      <SectionCard
        title="تقرير النقل"
        icon="🚚"
        index={5}
        accent="#2563eb"
        headerExtra={
          <Select
            label=""
            value={transportFilter}
            onChange={(e) => setTransportFilter(e.target.value)}
          >
            <option value="all">كل عمال النقل</option>
            {transportPersons.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        }
      >
        <div className="flex gap-3 flex-wrap mb-4">
          <Metric label="عدد التوصيلات" value={filteredTransportJobs.length} />
          <Metric
            label="إجمالي الأجور"
            value={fmt(transportFeesInRange)}
            color="#2563eb"
          />
          <Metric
            label="المحصل"
            value={fmt(transportCollectedInRange)}
            color="#16a34a"
          />
          <Metric
            label="المتبقي"
            value={fmt(transportFeesInRange - transportCollectedInRange)}
            color="#dc2626"
          />
        </div>
        {filteredTransportJobs.length === 0 ? (
          <EmptyState text="لا توجد عمليات نقل في هذه الفترة" />
        ) : (
          <Table
            cols={[
              "التاريخ",
              "رقم الفاتورة",
              "العميل",
              "عامل النقل",
              "عنوان التوصيل",
              "الأجرة",
              "الحالة"
            ]}
            rows={[...filteredTransportJobs]
              .reverse()
              .map((i) => [
                localDateOf(i.date),
                i.id.slice(-6).toUpperCase(),
                i.partyName || "—",
                i.transportPersonName || "—",
                i.deliveryAddress || "—",
                fmt(i.transportFee || 0),
                i.transportFeePaid ? (
                  <Badge color="green">مدفوعة</Badge>
                ) : (
                  <Badge color="red">غير مدفوعة</Badge>
                )
              ])}
          />
        )}
      </SectionCard>

      <SectionCard
        title={`المصروفات (${filteredExpenses.length}) — إجمالي ${fmt(totalExpenses)}`}
        icon="🧾"
        index={6}
        accent="#b91c1c"
        headerExtra={
          <Btn
            color="green"
            onClick={() => exportExpensesToCSV(filteredExpenses, from, to)}
          >
            ⬇️ تصدير المصروفات CSV
          </Btn>
        }
      >
        {filteredExpenses.length === 0 ? (
          <EmptyState text="لا توجد مصروفات في هذه الفترة" />
        ) : (
          <Table
            cols={["التاريخ", "التصنيف", "المبلغ", "ملاحظة"]}
            rows={[...filteredExpenses]
              .reverse()
              .map((e) => [
                localDateOf(e.date),
                <Badge color="red">{e.category}</Badge>,
                <span style={{ color: "#dc2626", fontWeight: 600 }}>
                  {fmt(e.amount)}
                </span>,
                e.note || "—"
              ])}
          />
        )}
      </SectionCard>
    </div>
  );
}
