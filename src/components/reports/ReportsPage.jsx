import { useState, useMemo } from "react";
import { Card, Table, Badge, Metric, Input, Select, Btn } from "../ui";
import { fmt, todayStr, localDateStr } from "../../utils/format";
import {
  exportInvoicesToCSV,
  exportExpensesToCSV
} from "../../utils/csvExport";
import {
  getCashMovements,
  cashRegisterBalance,
  dailyCashHistory,
  localDateOf
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
      return {
        from: localDateStr(from),
        to: localDateStr(to)
      };
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

export function ReportsPage({
  invoices,
  products = [],
  customers = [],
  suppliers = [],
  expenses = [],
  transportPersons = [],
  treasuryWithdrawals = [],
  treasuryDeposits = [],
  currentUser,
  showToast,
  setModal
}) {
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [type, setType] = useState("all");
  const [activeQuickFilter, setActiveQuickFilter] = useState("today");
  const [transportFilter, setTransportFilter] = useState("all");

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

  const { treasuryBalance, historyInRange } = useMemo(() => {
    const movements = getCashMovements(
      invoices,
      customers,
      suppliers,
      expenses,
      treasuryWithdrawals,
      treasuryDeposits
    );
    const fullHistory = dailyCashHistory(movements);
    const balance = cashRegisterBalance(movements);
    const inRange = fullHistory.filter((h) => h.date >= from && h.date <= to);
    return { treasuryBalance: balance, historyInRange: inRange };
  }, [
    invoices,
    customers,
    suppliers,
    expenses,
    treasuryWithdrawals,
    treasuryDeposits,
    from,
    to
  ]);

  return (
    <div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 16
        }}
      >
        📈 التقارير
      </h2>

      <Card>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14
          }}
        >
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => applyQuickFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border:
                  activeQuickFilter === f.key
                    ? "1px solid #2563eb"
                    : "1px solid #d1d5db",
                background: activeQuickFilter === f.key ? "#2563eb" : "#fff",
                color: activeQuickFilter === f.key ? "#fff" : "#374151",
                cursor: "pointer"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr auto",
            gap: 10,
            alignItems: "end"
          }}
        >
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
      </Card>

      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}
      >
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

      <div
        style={{
          fontSize: 12,
          color: "#92400e",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 8,
          padding: "8px 12px",
          marginBottom: 16
        }}
      >
        ⚠️ ملاحظة: صافي الربح يُحسب باستخدام سعر الشراء الحالي للأصناف، وليس
        السعر الفعلي وقت الشراء. إذا تغيرت أسعار الشراء لاحقاً (بسبب التضخم)،
        فقد يختلف الرقم الفعلي عن هذا التقدير. كما تم خصم المرتجعات من إجمالي
        المبيعات وتكلفة البضاعة المباعة لهذه الفترة، وأجرة النقل مستبعدة من صافي
        المبيعات لأنها تُحسب في تقرير النقل بشكل منفصل.
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>💰 الخزينة</h3>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: treasuryBalance >= 0 ? "#0891b2" : "#dc2626"
            }}
          >
            رصيد الخزينة الحالي: {fmt(treasuryBalance)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          الرصيد الحالي يمثل صافي النقدية الفعلية في المحل من كل عمليات القبض
          والدفع (مبيعات، مشتريات، دفعات، استرجاعات، مصروفات، سحوبات، إيداعات) —
          وليس مرتبطاً بتاريخ معين. المرتجعات لا تؤثر على الخزينة لأنها رصيد
          دائن للعميل وليست نقدية فعلية. لإدارة السحب والإيداع من الخزينة، اذهب
          لصفحة "الخزينة" من القائمة الجانبية.
        </div>

        <h4
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginTop: 8,
            marginBottom: 8
          }}
        >
          السجل اليومي للخزينة
        </h4>
        {historyInRange.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
              padding: "24px 0"
            }}
          >
            لا توجد حركات نقدية في هذه الفترة
          </div>
        ) : (
          <Table
            cols={["التاريخ", "صافي اليوم", "رصيد الخزينة في نهاية اليوم"]}
            rows={[...historyInRange].reverse().map((h) => [
              h.date,
              <span
                style={{
                  color: h.netOfDay >= 0 ? "#16a34a" : "#dc2626",
                  fontWeight: 600
                }}
              >
                {fmt(h.netOfDay)}
              </span>,
              <span style={{ fontWeight: 700 }}>{fmt(h.balanceEndOfDay)}</span>
            ])}
          />
        )}

        {treasuryWithdrawals.length > 0 && (
          <>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginTop: 16,
                marginBottom: 8
              }}
            >
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
            <h4
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginTop: 16,
                marginBottom: 8
              }}
            >
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
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          الفواتير
        </h3>
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
                style={{ color: i.total - i.paid > 0 ? "#dc2626" : "#16a34a" }}
              >
                {fmt(i.total - i.paid)}
              </span>
            ])}
        />
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          المرتجعات ({filteredReturns.length}) — إجمالي{" "}
          {fmt(totalReturnsAmount)}
        </h3>
        {filteredReturns.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
              padding: "24px 0"
            }}
          >
            لا توجد مرتجعات في هذه الفترة
          </div>
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
      </Card>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>🚚 تقرير النقل</h3>
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
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12
          }}
        >
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
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
              padding: "24px 0"
            }}
          >
            لا توجد عمليات نقل في هذه الفترة
          </div>
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
      </Card>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>
            المصروفات ({filteredExpenses.length}) — إجمالي {fmt(totalExpenses)}
          </h3>
          <Btn
            color="green"
            onClick={() => exportExpensesToCSV(filteredExpenses, from, to)}
          >
            ⬇️ تصدير المصروفات CSV
          </Btn>
        </div>
        {filteredExpenses.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
              padding: "24px 0"
            }}
          >
            لا توجد مصروفات في هذه الفترة
          </div>
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
      </Card>
    </div>
  );
}
