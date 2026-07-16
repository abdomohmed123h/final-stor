import { useState } from "react";
import { Modal, Metric, Badge, Input, Btn } from "../ui";
import { fmt } from "../../utils/format";
import { reservationPaymentStatus } from "../../utils/calculations";

const statusBadge = { active: "green", completed: "blue", cancelled: "red" };
const statusLabel = { active: "نشط", completed: "مكتمل", cancelled: "ملغي" };

export function ReservationDetailModal({
  reservation,
  onAddPayment,
  onCancel,
  onConvertToSale,
  onClose,
  readOnly = false
}) {
  const [payAmount, setPayAmount] = useState("");
  const remaining = reservation.total - reservation.paid;

  return (
    <Modal
      title={`تفاصيل الحجز — ${reservation.customerName}`}
      onClose={onClose}
    >
      <div className="flex gap-2.5 mb-3.5 flex-wrap">
        <Metric label="المنتج" value={reservation.productName} />
        <Metric
          label="الكمية المحجوزة"
          value={`${reservation.qty} ${reservation.unit || ""}`}
        />
        <Metric
          label="الإجمالي"
          value={fmt(reservation.total)}
          color="#2563eb"
        />
        <Metric label="المدفوع" value={fmt(reservation.paid)} color="#16a34a" />
        <Metric
          label="المتبقي"
          value={fmt(remaining)}
          color={remaining > 0 ? "#dc2626" : "#16a34a"}
        />
      </div>
      <div className="mb-3 flex gap-2">
        <Badge color={statusBadge[reservation.status]}>
          {statusLabel[reservation.status]}
        </Badge>
        <Badge color="gray">{reservationPaymentStatus(reservation)}</Badge>
      </div>
      {reservation.notes && (
        <div className="text-xs text-gray-500 mb-3">
          ملاحظات: {reservation.notes}
        </div>
      )}

      {!readOnly && reservation.status === "active" && (
        <>
          <div className="flex gap-2 items-end mb-3">
            <Input
              label="تسجيل دفعة جديدة (ج.م)"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0"
            />
            <Btn
              color="green"
              onClick={() => {
                if (parseFloat(payAmount) > 0) {
                  onAddPayment(parseFloat(payAmount));
                  setPayAmount("");
                }
              }}
            >
              تسجيل
            </Btn>
          </div>
          <div className="flex gap-2 justify-end">
            <Btn color="red" onClick={onCancel}>
              إلغاء الحجز
            </Btn>
            <Btn color="blue" onClick={onConvertToSale}>
              تحويل إلى فاتورة بيع
            </Btn>
          </div>
        </>
      )}
      <div className="flex justify-end mt-3">
        <Btn color="gray" onClick={onClose}>
          إغلاق
        </Btn>
      </div>
    </Modal>
  );
}
