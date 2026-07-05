import { Modal, Table, Btn } from "../ui";
import { fmt, shortId } from "../../utils/format";
import { invoiceRemaining } from "../../utils/calculations";

export function InvoicePreview({ inv, onClose }) {
  const remaining = invoiceRemaining(inv);
  const itemsTotal = inv.itemsTotal ?? inv.total;
  const hasTransport = !!inv.transportId;

  return (
    <Modal title={`فاتورة رقم: ${shortId(inv.id)}`} onClose={onClose}>
      <div
        style={{
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 12,
          marginBottom: 12
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13
          }}
        >
          <div>
            <b>النوع:</b> {inv.type === "sale" ? "فاتورة بيع" : "فاتورة شراء"}
          </div>
          <div>
            <b>التاريخ:</b> {new Date(inv.date).toLocaleDateString("ar-EG")}
          </div>
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          <b>{inv.type === "sale" ? "العميل" : "المورد"}:</b>{" "}
          {inv.partyName || "نقدي"}
        </div>
        {hasTransport && (
          <div style={{ fontSize: 13, marginTop: 6, color: "#0369a1" }}>
            <b>🚚 عامل النقل:</b> {inv.transportPersonName || "—"}
            {inv.deliveryAddress && (
              <span>
                {" — "}
                <b>عنوان التوصيل:</b> {inv.deliveryAddress}
              </span>
            )}
          </div>
        )}
        {inv.notes && (
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            ملاحظات: {inv.notes}
          </div>
        )}
      </div>

      <Table
        cols={["الصنف", "الكمية", "سعر الوحدة", "الإجمالي"]}
        rows={(inv.items || []).map((item) => [
          item.productName || item.productId,
          item.qty,
          fmt(item.price),
          fmt((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0))
        ])}
      />

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          marginTop: 12,
          paddingTop: 12
        }}
      >
        {hasTransport && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 6,
                color: "#4b5563"
              }}
            >
              <span>إجمالي الأصناف</span>
              <span>{fmt(itemsTotal)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 6,
                color: "#0369a1"
              }}
            >
              <span>🚚 أجرة النقل ({inv.transportPersonName})</span>
              <span>{fmt(inv.transportFee)}</span>
            </div>
          </>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 14,
            marginBottom: 6
          }}
        >
          <span>الإجمالي الكلي</span>
          <b>{fmt(inv.total)}</b>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 14,
            marginBottom: 6,
            color: "#16a34a"
          }}
        >
          <span>المدفوع</span>
          <b>{fmt(inv.paid)}</b>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 16,
            fontWeight: 700,
            color: remaining > 0 ? "#dc2626" : "#16a34a"
          }}
        >
          <span>المتبقي</span>
          <span>{fmt(remaining)}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          marginTop: 14
        }}
      >
        <Btn color="gray" onClick={onClose}>
          إغلاق
        </Btn>
        <Btn color="blue" onClick={() => window.print()}>
          🖨️ طباعة
        </Btn>
      </div>
    </Modal>
  );
}
