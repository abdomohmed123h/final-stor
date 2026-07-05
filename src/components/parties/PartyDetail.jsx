import { Modal, Metric, Table } from "../ui";
import { fmt } from "../../utils/format";
import { invoiceRemaining, debtFor, creditFor } from "../../utils/calculations";

export function PartyDetail({
  party,
  invoices,
  payments = [],
  withdrawals = [],
  returns = [],
  onClose
}) {
  const total = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaidOnInvoices = invoices.reduce((s, i) => s + i.paid, 0);

  const debt = debtFor(invoices, party.id, payments, returns);
  const credit = creditFor(invoices, party.id, payments, withdrawals, returns);

  const ledger = [
    ...payments.map((p) => ({ ...p, kind: "payment" })),
    ...withdrawals.map((w) => ({ ...w, kind: "withdrawal" })),
    ...returns.map((r) => ({ ...r, kind: "return" }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const kindLabel = (t) => {
    if (t.kind === "payment")
      return <span className="text-green-600 font-semibold">دفعة مستلمة</span>;
    if (t.kind === "withdrawal")
      return <span className="text-blue-600 font-semibold">سحب فلوس</span>;
    return (
      <span className="text-purple-600 font-semibold">
        مرتجع{t.productName ? `: ${t.productName}` : ""}
      </span>
    );
  };

  return (
    <Modal title={`كشف حساب: ${party.name}`} onClose={onClose}>
      <div className="flex gap-2.5 mb-3.5 flex-wrap">
        <Metric label="إجمالي الفواتير" value={fmt(total)} />
        <Metric
          label="مدفوع مع الفواتير"
          value={fmt(totalPaidOnInvoices)}
          color="#16a34a"
        />
        <Metric label="الرصيد المستحق" value={fmt(debt)} color="#dc2626" />
        <Metric label="رصيد علي المخزن" value={fmt(credit)} color="#2563eb" />
      </div>

      <h4 className="text-sm font-semibold mb-2">الفواتير</h4>
      <Table
        cols={["رقم الفاتورة", "التاريخ", "الإجمالي", "مدفوع", "متبقي"]}
        rows={invoices.map((i) => [
          i.id.slice(-6).toUpperCase(),
          new Date(i.date).toLocaleDateString("ar-EG"),
          fmt(i.total),
          fmt(i.paid),
          <span
            className={
              invoiceRemaining(i) > 0 ? "text-red-600" : "text-green-600"
            }
          >
            {fmt(invoiceRemaining(i))}
          </span>
        ])}
      />

      {ledger.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mt-4 mb-2">
            سجل الدفعات والسحوبات والمرتجعات
          </h4>
          <Table
            cols={["التاريخ", "النوع", "المبلغ", "ملاحظة"]}
            rows={ledger.map((t) => [
              new Date(t.date).toLocaleDateString("ar-EG"),
              kindLabel(t),
              fmt(t.amount),
              t.note || "—"
            ])}
          />
        </>
      )}
    </Modal>
  );
}
