import { Modal, Metric, Table, Badge, Btn } from "../ui";
import { fmt } from "../../utils/format";
import { transportStatsFor } from "../../utils/calculations";

export function TransportPersonDetail({
  person,
  invoices,
  onMarkPaid,
  onClose
}) {
  const { totalJobs, totalFees, totalCollected, outstanding, jobs } =
    transportStatsFor(invoices, person.id);

  return (
    <Modal title={`سجل عامل النقل: ${person.name}`} onClose={onClose}>
      <div className="flex gap-2.5 mb-3.5 flex-wrap">
        <Metric label="عدد التوصيلات" value={totalJobs} />
        <Metric label="إجمالي الأجور" value={fmt(totalFees)} color="#2563eb" />
        <Metric label="المحصل" value={fmt(totalCollected)} color="#16a34a" />
        <Metric
          label="المتبقي له"
          value={fmt(outstanding)}
          color={outstanding > 0 ? "#dc2626" : "#16a34a"}
        />
      </div>

      <h4 className="text-sm font-semibold mb-2">سجل التوصيلات</h4>
      {jobs.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-6">
          لا توجد توصيلات مسجلة
        </div>
      ) : (
        <Table
          cols={[
            "التاريخ",
            "رقم الفاتورة",
            "العميل",
            "عنوان التوصيل",
            "الأجرة",
            "الحالة",
            ""
          ]}
          rows={[...jobs].reverse().map((inv) => [
            new Date(inv.date).toLocaleDateString("ar-EG"),
            inv.id.slice(-6).toUpperCase(),
            inv.partyName || "—",
            inv.deliveryAddress || "—",
            fmt(inv.transportFee || 0),
            inv.transportFeePaid ? (
              <Badge color="green">مدفوعة</Badge>
            ) : (
              <Badge color="red">غير مدفوعة</Badge>
            ),
            !inv.transportFeePaid ? (
              <Btn small color="green" onClick={() => onMarkPaid(inv.id)}>
                تحديد كمدفوعة
              </Btn>
            ) : (
              <span className="text-gray-300 text-xs">—</span>
            )
          ])}
        />
      )}
    </Modal>
  );
}
