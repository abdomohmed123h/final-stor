import { useState } from "react";
import { Modal, Metric, Table, Badge, Input, Btn } from "../ui";
import { fmt } from "../../utils/format";
import {
  invoiceRemaining,
  debtFor,
  creditFor,
  reservationPaymentStatus
} from "../../utils/calculations";

const reservationStatusBadge = {
  active: "green",
  completed: "blue",
  cancelled: "red"
};
const reservationStatusLabel = {
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي"
};

function ReservationRow({ reservation, onPay, onCancel, onConvertToSale }) {
  const [amount, setAmount] = useState("");
  const remaining = reservation.total - reservation.paid;
  const isActive = reservation.status === "active";

  return (
    <div className="border border-gray-100 rounded-lg p-3 mb-2">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <div className="text-sm font-semibold">{reservation.productName}</div>
          <div className="text-xs text-gray-500">
            {reservation.qty} {reservation.unit || ""} —{" "}
            {new Date(reservation.date).toLocaleDateString("ar-EG")}
          </div>
        </div>
        <div className="flex gap-1.5">
          <Badge color={reservationStatusBadge[reservation.status]}>
            {reservationStatusLabel[reservation.status]}
          </Badge>
          <Badge color="gray">{reservationPaymentStatus(reservation)}</Badge>
        </div>
      </div>

      <div className="flex gap-3 mt-2 text-xs">
        <span className="text-gray-500">
          الإجمالي: <b className="text-slate-700">{fmt(reservation.total)}</b>
        </span>
        <span className="text-gray-500">
          المدفوع: <b className="text-green-600">{fmt(reservation.paid)}</b>
        </span>
        <span className="text-gray-500">
          المتبقي:{" "}
          <b className={remaining > 0 ? "text-red-600" : "text-green-600"}>
            {fmt(remaining)}
          </b>
        </span>
      </div>

      {isActive && (
        <>
          {remaining > 0 && (
            <div className="flex gap-2 items-end mt-2">
              <Input
                label="دفعة جديدة (ج.م)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
              <Btn
                small
                color="green"
                onClick={() => {
                  const amt = parseFloat(amount);
                  if (amt > 0) {
                    onPay(reservation, amt);
                    setAmount("");
                  }
                }}
              >
                دفع
              </Btn>
            </div>
          )}
          <div className="flex gap-2 justify-end mt-2">
            <Btn small color="red" onClick={() => onCancel(reservation)}>
              إلغاء الحجز
            </Btn>
            <Btn
              small
              color="blue"
              onClick={() => onConvertToSale(reservation)}
            >
              تحويل إلى فاتورة بيع
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}

export function PartyDetail({
  party,
  invoices,
  payments = [],
  withdrawals = [],
  returns = [],
  reservations = [],
  onPayReservation,
  onCancelReservation,
  onConvertReservationToSale,
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

      {reservations.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mt-4 mb-2">
            حجوزات العميل ({reservations.length})
          </h4>
          {[...reservations]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((r) => (
              <ReservationRow
                key={r.id}
                reservation={r}
                onPay={onPayReservation}
                onCancel={onCancelReservation}
                onConvertToSale={onConvertReservationToSale}
              />
            ))}
        </>
      )}

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
