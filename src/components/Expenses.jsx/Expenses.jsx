import { useState, useMemo } from "react";
import { Card, Table, Btn, Input, Select, Badge, Metric } from "../ui";
import { fmt, uid, now, todayStr } from "../../utils/format";
import { expensesOnDate } from "../../utils/calculations";
import { exportExpensesToCSV } from "../../utils/csvExport";

const CATEGORIES = [
  { label: "إيجار", color: "purple" },
  { label: "كهرباء ومياه", color: "blue" },
  { label: "رواتب", color: "green" },
  { label: "نقل وشحن", color: "orange" },
  { label: "أجرة تحميل/تفريغ", color: "blue" },
  { label: "صيانة", color: "gray" },
  { label: "أخرى", color: "red" }
];

const categoryColor = (label) =>
  CATEGORIES.find((c) => c.label === label)?.color || "gray";

export function ExpensesPage({ expenses, setExpenses, showToast }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [note, setNote] = useState("");

  // Date-range + category filter, same pattern as ReportsPage.
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [filterCategory, setFilterCategory] = useState("all");

  const today = todayStr();

  const {
    todayExpenses,
    todayTotal,
    filtered,
    filteredTotal,
    allTotal,
    byCategory
  } = useMemo(() => {
    const list = expensesOnDate(expenses, today);

    const filteredList = expenses.filter((e) => {
      const date = e.date.slice(0, 10);
      return (
        date >= from &&
        date <= to &&
        (filterCategory === "all" || e.category === filterCategory)
      );
    });

    const grouped = CATEGORIES.map((c) => ({
      ...c,
      total: expenses
        .filter((e) => e.category === c.label)
        .reduce((s, e) => s + e.amount, 0)
    })).filter((c) => c.total > 0);

    return {
      todayExpenses: list,
      todayTotal: list.reduce((s, e) => s + e.amount, 0),
      filtered: [...filteredList].reverse(),
      filteredTotal: filteredList.reduce((s, e) => s + e.amount, 0),
      allTotal: expenses.reduce((s, e) => s + e.amount, 0),
      byCategory: grouped
    };
  }, [expenses, today, from, to, filterCategory]);

  const handleAdd = () => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      showToast("أدخل مبلغاً صحيحاً");
      return;
    }
    const expense = {
      id: uid(),
      amount: amt,
      category,
      note: note || "",
      date: now()
    };
    setExpenses([...expenses, expense]);
    showToast("✅ تم تسجيل المصروف");
    setAmount("");
    setNote("");
  };

  const handleDelete = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    showToast("🗑️ تم حذف المصروف");
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">💸 المصروفات</h2>

      {/* Add expense form */}
      <Card>
        <h3 className="text-sm font-semibold mb-3">➕ إضافة مصروف جديد</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            label="المبلغ (ج.م)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Select
            label="التصنيف"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="ملاحظة"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظات اختيارية"
        />
        <div className="mt-2">
          <Btn color="red" onClick={handleAdd}>
            ✅ تسجيل المصروف
          </Btn>
        </div>
      </Card>

      {/* Summary metrics */}
      <div className="flex gap-3 flex-wrap mb-5">
        <Metric label="مصروفات اليوم" value={fmt(todayTotal)} color="#dc2626" />
        <Metric
          label="إجمالي كل المصروفات"
          value={fmt(allTotal)}
          color="#b91c1c"
        />
        <Metric label="عدد مصروفات اليوم" value={todayExpenses.length} />
      </div>

      {/* Breakdown by category */}
      {byCategory.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3">
            📊 المصروفات حسب التصنيف
          </h3>
          <div className="flex gap-2 flex-wrap">
            {byCategory.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
              >
                <Badge color={c.color}>{c.label}</Badge>
                <span className="text-sm font-semibold text-gray-700">
                  {fmt(c.total)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Date-range filter + export */}
      <Card>
        <h3 className="text-sm font-semibold mb-3">🔍 تصفية وتصدير</h3>
        <div className="grid grid-cols-4 gap-3 items-end">
          <Input
            label="من تاريخ"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="إلى تاريخ"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Select
            label="التصنيف"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">الكل</option>
            {CATEGORIES.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </Select>
          <Btn
            color="green"
            onClick={() => exportExpensesToCSV(filtered, from, to)}
          >
            ⬇️ تصدير CSV
          </Btn>
        </div>
      </Card>

      {/* Filtered results */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">
            النتائج ({filtered.length}) — {from} إلى {to}
          </h3>
          <span className="text-red-600 font-bold">{fmt(filteredTotal)}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-6">
            لا توجد مصروفات في هذه الفترة
          </div>
        ) : (
          <Table
            cols={["التاريخ", "التصنيف", "المبلغ", "ملاحظة", "الوقت", ""]}
            rows={filtered.map((e) => [
              e.date.slice(0, 10),
              <Badge color={categoryColor(e.category)}>{e.category}</Badge>,
              <span className="text-red-600 font-semibold">
                {fmt(e.amount)}
              </span>,
              e.note || "—",
              new Date(e.date).toLocaleTimeString("ar-EG"),
              <Btn small color="gray" onClick={() => handleDelete(e.id)}>
                حذف
              </Btn>
            ])}
          />
        )}
      </Card>
    </div>
  );
}
