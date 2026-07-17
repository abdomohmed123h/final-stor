import { useState } from "react";
import { Card, Table, Btn, Badge } from "../ui";
import { AddReservationModal } from "./AddReservationModal";
import { fmt, uid, now } from "../../utils/format";
import {
  reservationPaymentStatus,
  reservationEffectivePaid
} from "../../utils/calculations";

export function ReservationsPage({
  reservations,
  setReservations,
  products,
  customers,
  setCustomers,
  invoices,
  setModal,
  showToast,
  currentUser
}) {
  const [tab, setTab] = useState("active");

  const filtered = reservations.filter((r) => r.status === tab);
  const totalActiveValue = reservations
    .filter((r) => r.status === "active")
    .reduce((s, r) => s + r.total, 0);
  const customersWithReservations = new Set(
    reservations.filter((r) => r.status === "active").map((r) => r.customerId)
  ).size;

  const addReservation = (form) => {
    const product = products.find((p) => p.id === form.productId);
    const customer = customers.find((c) => c.id === form.customerId);
    const reservation = {
      id: uid(),
      ...form,
      productName: product?.name || "",
      unit: product?.unit || "",
      customerName: customer?.name || "",
      status: "active",
      date: now(),
      payments:
        form.paid > 0
          ? [
              {
                id: uid(),
                amount: form.paid,
                date: now(),
                by: currentUser?.name || "",
                note: "دفعة عند إنشاء الحجز"
              }
            ]
          : [],
      history: [
        { date: now(), action: "تم إنشاء الحجز", by: currentUser?.name || "" }
      ]
    };
    setReservations([...reservations, reservation]);

    if (form.creditUsed > 0) {
      setCustomers(
        customers.map((c) =>
          c.id === form.customerId
            ? {
                ...c,
                withdrawals: [
                  ...(c.withdrawals || []),
                  {
                    id: uid(),
                    amount: form.creditUsed,
                    type: "reservation_credit",
                    note: `استخدام رصيد في حجز ${reservation.id.slice(-6).toUpperCase()}`,
                    date: now()
                  }
                ]
              }
            : c
        )
      );
    }

    showToast("✅ تم تسجيل الحجز");
    setModal(null);
  };

  const addPayment = (reservation, amount) => {
    setReservations(
      reservations.map((r) =>
        r.id === reservation.id
          ? {
              ...r,
              paid: r.paid + amount,
              payments: [
                ...(r.payments || []),
                {
                  id: uid(),
                  amount,
                  date: now(),
                  by: currentUser?.name || "",
                  note: "دفعة إضافية"
                }
              ],
              history: [
                ...(r.history || []),
                {
                  date: now(),
                  action: `تسجيل دفعة ${fmt(amount)}`,
                  by: currentUser?.name || ""
                }
              ]
            }
          : r
      )
    );
    showToast(`✅ تم تسجيل دفعة ${fmt(amount)}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">📦 حجوزات العملاء</h2>
        <Btn
          color="blue"
          onClick={() =>
            setModal(
              <AddReservationModal
                products={products}
                customers={customers}
                invoices={invoices}
                onSave={addReservation}
                onClose={() => setModal(null)}
                showToast={showToast}
              />
            )
          }
        >
          + حجز جديد
        </Btn>
      </div>

      <div className="flex gap-3 flex-wrap mb-5">
        <div className="bg-white rounded-xl shadow p-4 min-w-[140px]">
          <div className="text-xs text-gray-500 mb-1">قيمة الحجوزات النشطة</div>
          <div className="text-lg font-bold text-blue-600">
            {fmt(totalActiveValue)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 min-w-[140px]">
          <div className="text-xs text-gray-500 mb-1">عملاء لديهم حجوزات</div>
          <div className="text-lg font-bold text-slate-700">
            {customersWithReservations}
          </div>
        </div>
      </div>

      <Card>
        <div className="flex gap-2 mb-3">
          {[
            ["active", "نشطة"],
            ["completed", "مكتملة"],
            ["cancelled", "ملغاة"]
          ].map(([key, label]) => (
            <Btn
              key={key}
              small
              color={tab === key ? "blue" : "gray"}
              onClick={() => setTab(key)}
            >
              {label}
            </Btn>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            لا توجد حجوزات
          </div>
        ) : (
          <Table
            cols={[
              "العميل",
              "المنتج",
              "الكمية",
              "الإجمالي",
              "المدفوع",
              "المتبقي",
              "حالة الدفع",
              "التاريخ"
            ]}
            rows={filtered.map((r) => {
              const effectivePaid = reservationEffectivePaid(r);
              return [
                r.customerName,
                r.productName,
                `${r.qty} ${r.unit || ""}`,
                fmt(r.total),
                fmt(effectivePaid),
                <span
                  className={
                    r.total - effectivePaid > 0
                      ? "text-red-600 font-semibold"
                      : "text-green-600"
                  }
                >
                  {fmt(r.total - effectivePaid)}
                </span>,
                <Badge color="gray">{reservationPaymentStatus(r)}</Badge>,
                new Date(r.date).toLocaleDateString("ar-EG")
              ];
            })}
          />
        )}
      </Card>

      <div className="text-xs text-gray-400 mt-2 text-center">
        💡 لإدارة الدفعات أو الإلغاء أو تحويل الحجز إلى فاتورة بيع، اذهب إلى
        صفحة العميل واضغط "التفاصيل"
      </div>
    </div>
  );
}
