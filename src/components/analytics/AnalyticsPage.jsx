import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";
import { Card, Table, Badge } from "../ui";
import { PartyDetail } from "../parties/PartyDetail";
import { AnimatedMetric } from "../dashboard/AnimatedMetric";
import { fmt } from "../../utils/format";
import {
  topSellingProducts,
  topCustomersByRevenue,
  debtAgingReport,
  daysUntilStockout,
  mostProfitableProducts,
  salesByDayOfWeek,
  monthlyRevenueTrend,
  invoicesForParty
} from "../../utils/calculations";

const bucketColor = {
  "٠-٧ أيام": "green",
  "٨-٣٠ يوم": "orange",
  "أكثر من ٣٠ يوم": "red",
  "غير محدد": "gray"
};

// Vibrant, fully distinct palette — one identity per chart.
const PALETTE = {
  topProducts: "#ec4899", // pink
  profitable: "#8b5cf6", // violet
  topCustomers: "#3b82f6", // blue
  dayOfWeek: [
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#8b5cf6",
    "#3b82f6",
    "#06b6d4",
    "#10b981"
  ], // rainbow per bar
  trendRevenue: "#10b981", // emerald
  trendProfit: "#f59e0b" // amber
};

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
      <Card
        className="border shadow-sm hover:shadow-lg transition-shadow"
        style={{ borderTop: `3px solid ${accent}` }}
      >
        <h3 className="text-sm font-bold mb-4 text-slate-700 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        {children}
        {footnote && (
          <div className="text-xs text-gray-400 mt-2">{footnote}</div>
        )}
      </Card>
    </motion.div>
  );
}

function EmptyState({ text }) {
  return <div className="text-center text-gray-400 text-sm py-8">{text}</div>;
}

export function AnalyticsPage({ invoices, products, customers, setModal }) {
  const topProducts = topSellingProducts(invoices, products, 10);
  const topCustomers = topCustomersByRevenue(invoices, customers, 10);
  const aging = debtAgingReport(invoices, customers);
  const stockout = daysUntilStockout(invoices, products, 30).filter(
    (p) => p.daysLeft <= 30
  );
  const profitable = mostProfitableProducts(invoices, products, 10);
  const byDayOfWeek = salesByDayOfWeek(invoices);
  const monthlyTrend = monthlyRevenueTrend(invoices, products, 6);

  const topProductQty = topProducts[0]?.qty || 0;
  const topCustomerRevenue = topCustomers[0]?.revenue || 0;
  const totalOutstandingDebt = aging.reduce((s, a) => s + a.debt, 0);
  const totalProfitTop10 = profitable.reduce((s, p) => s + p.totalProfit, 0);

  const openCustomerDetail = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setModal(
      <PartyDetail
        party={customer}
        invoices={invoicesForParty(invoices, customer.id)}
        payments={customer.payments || []}
        withdrawals={customer.withdrawals || []}
        returns={customer.returns || []}
        onClose={() => setModal(null)}
      />
    );
  };

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-bold text-slate-800 mb-5"
      >
        🧠 التحليلات
      </motion.h2>

      {/* Animated headline numbers */}
      <div className="flex gap-3 flex-wrap mb-5">
        <AnimatedMetric
          label="أعلى كمية مبيعة (صنف واحد)"
          value={topProductQty}
          color="#ec4899"
          decimals={0}
          suffix=""
        />
        <AnimatedMetric
          label="أعلى إيراد عميل واحد"
          value={topCustomerRevenue}
          color="#3b82f6"
        />
        <AnimatedMetric
          label="إجمالي الديون المستحقة"
          value={totalOutstandingDebt}
          color="#ef4444"
        />
        <AnimatedMetric
          label="ربح أفضل 10 أصناف"
          value={totalProfitTop10}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="الأصناف الأكثر مبيعاً (بالكمية)"
          icon="📦"
          index={0}
          accent={PALETTE.topProducts}
        >
          {topProducts.length === 0 ? (
            <EmptyState text="لا توجد مبيعات بعد" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  width={120}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12
                  }}
                  formatter={(v, _, props) => [
                    `${v} ${props.payload.unit}`,
                    "الكمية المباعة"
                  ]}
                />
                <Bar
                  dataKey="qty"
                  fill={PALETTE.topProducts}
                  radius={[0, 6, 6, 0]}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          title="الأصناف الأكثر ربحية"
          icon="💎"
          index={1}
          accent={PALETTE.profitable}
        >
          {profitable.length === 0 ? (
            <EmptyState text="لا توجد بيانات ربحية بعد" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={profitable}
                layout="vertical"
                margin={{ left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  width={120}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12
                  }}
                  formatter={(v) => [fmt(v), "إجمالي الربح"]}
                />
                <Bar
                  dataKey="totalProfit"
                  fill={PALETTE.profitable}
                  radius={[0, 6, 6, 0]}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          title="أفضل العملاء (بالإيراد)"
          icon="👥"
          index={2}
          accent={PALETTE.topCustomers}
          footnote={
            topCustomers.length > 0
              ? "💡 اضغط على أي عمود لعرض تفاصيل حساب العميل"
              : null
          }
        >
          {topCustomers.length === 0 ? (
            <EmptyState text="لا توجد بيانات عملاء بعد" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topCustomers}
                layout="vertical"
                margin={{ left: 40 }}
                onClick={(e) =>
                  e?.activePayload?.[0] &&
                  openCustomerDetail(e.activePayload[0].payload.partyId)
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  width={120}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12
                  }}
                  formatter={(v) => [fmt(v), "الإيراد"]}
                />
                <Bar
                  dataKey="revenue"
                  fill={PALETTE.topCustomers}
                  radius={[0, 6, 6, 0]}
                  cursor="pointer"
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          title="المبيعات حسب يوم الأسبوع"
          icon="📅"
          index={3}
          accent={PALETTE.dayOfWeek[5]}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDayOfWeek} margin={{ top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" fontSize={11} stroke="#94a3b8" />
              <YAxis fontSize={11} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: 12
                }}
                formatter={(v) => [fmt(v), "الإيراد"]}
              />
              <Bar
                dataKey="total"
                radius={[6, 6, 0, 0]}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {byDayOfWeek.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PALETTE.dayOfWeek[i % PALETTE.dayOfWeek.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <SectionCard
        title="الإيراد والربح — آخر 6 أشهر"
        icon="📈"
        index={4}
        accent={PALETTE.trendRevenue}
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyTrend}>
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
              name="الإيراد"
              stroke={PALETTE.trendRevenue}
              strokeWidth={2.5}
              dot={{ r: 4 }}
              animationDuration={1200}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="الربح"
              stroke={PALETTE.trendProfit}
              strokeWidth={2.5}
              dot={{ r: 4 }}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard
        title="تقادم ديون العملاء"
        icon="⏳"
        index={5}
        accent="#ef4444"
      >
        {aging.length === 0 ? (
          <EmptyState text="لا توجد ديون مستحقة 🎉" />
        ) : (
          <Table
            cols={[
              "العميل",
              "المبلغ المستحق",
              "آخر نشاط (أيام)",
              "التصنيف",
              ""
            ]}
            rows={aging.map((a) => [
              a.name,
              <span className="text-red-600 font-semibold">{fmt(a.debt)}</span>,
              a.daysSince ?? "—",
              <Badge color={bucketColor[a.bucket] || "gray"}>{a.bucket}</Badge>,
              <button
                className="text-blue-600 text-xs underline"
                onClick={() => openCustomerDetail(a.customerId)}
              >
                عرض الحساب
              </button>
            ])}
          />
        )}
      </SectionCard>

      <SectionCard
        title="أصناف على وشك النفاد (خلال 30 يوم)"
        icon="📉"
        index={6}
        accent="#f97316"
      >
        {stockout.length === 0 ? (
          <EmptyState text="لا توجد أصناف مهددة بالنفاد حالياً" />
        ) : (
          <Table
            cols={[
              "الصنف",
              "المخزون الحالي",
              "متوسط البيع اليومي",
              "أيام متبقية تقريباً"
            ]}
            rows={stockout.map((p) => [
              p.name,
              `${p.stock} ${p.unit}`,
              `${p.avgDaily.toFixed(1)} ${p.unit}/يوم`,
              <span
                className={
                  p.daysLeft <= 7
                    ? "text-red-600 font-bold"
                    : "text-orange-600 font-semibold"
                }
              >
                {p.daysLeft} يوم
              </span>
            ])}
          />
        )}
      </SectionCard>
    </div>
  );
}
