import { Modal, Btn, Badge } from "../ui";
import { reservationPaymentStatus } from "../../utils/calculations";

export function ReservationWarningModal({
  conflicts,
  onContinue,
  onCancel,
  onViewDetail
}) {
  return (
    <Modal title="⚠️ تنبيه — يوجد حجز على هذا الصنف" onClose={onCancel}>
      {conflicts.map((r) => (
        <div
          key={r.id}
          className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2 text-sm"
        >
          <div>
            <b>المنتج:</b> {r.productName}
          </div>
          <div>
            <b>الكمية المحجوزة:</b> {r.qty} {r.unit}
          </div>
          <div>
            <b>العميل:</b> {r.customerName}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <b>حالة الدفع:</b>{" "}
            <Badge color="gray">{reservationPaymentStatus(r)}</Badge>
          </div>
          <button
            className="text-blue-600 text-xs underline mt-1"
            onClick={() => onViewDetail(r)}
          >
            عرض تفاصيل الحجز
          </button>
        </div>
      ))}
      <div className="text-sm font-semibold mb-3">
        هل تريد المتابعة رغم وجود الحجز؟
      </div>
      <div className="flex gap-2 justify-end">
        <Btn color="gray" onClick={onCancel}>
          إلغاء العملية
        </Btn>
        <Btn color="red" onClick={onContinue}>
          متابعة البيع
        </Btn>
      </div>
    </Modal>
  );
}
