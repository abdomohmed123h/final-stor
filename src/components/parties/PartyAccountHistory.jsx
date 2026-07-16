import { Modal, Table, Badge } from "../ui";
import { fmt } from "../../utils/format";
import { partyAccountHistory } from "../../utils/calculations";

const TYPE_BADGE = {
  sale: "blue",
  payment: "green",
  withdrawal: "orange",
  return: "purple",
  reservation: "gray",
  reservation_payment: "green",
  reservation_credit_transfer: "cyan"
};

export function PartyAccountHistory({
  party,
  invoices,
  reservations = [],
  onClose
}) {
  const history = partyAccountHistory(invoices, party, reservations);

  return (
    <Modal title={`سجل الحساب: ${party.name}`} onClose={onClose}>
      {history.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13,
            padding: "24px 0"
          }}
        >
          لا توجد حركات مسجلة
        </div>
      ) : (
        <Table
          cols={[
            "التاريخ والوقت",
            "نوع العملية",
            "رقم الفاتورة",
            "المبلغ",
            "ملاحظات"
          ]}
          rows={history.map((h) => [
            new Date(h.date).toLocaleString("ar-EG"),
            <Badge color={TYPE_BADGE[h.type] || "gray"}>{h.typeLabel}</Badge>,
            h.invoiceNumber,
            h.amount ? fmt(h.amount) : "—",
            h.note || "—"
          ])}
        />
      )}
    </Modal>
  );
}
