import { Card, Table, Btn, Badge } from "../ui";
import { AddTransportModal } from "./AddTransportModal";
import { TransportPersonDetail } from "./TransportPersonDetail";
import { fmt, uid, now } from "../../utils/format";
import { transportStatsFor } from "../../utils/calculations";

export function TransportationPage({
  transportPersons,
  setTransportPersons,
  invoices,
  setInvoices,
  showToast,
  setModal
}) {
  const addPerson = (form) => {
    setTransportPersons([
      ...transportPersons,
      { id: uid(), ...form, createdAt: now() }
    ]);
    showToast("✅ تم إضافة عامل النقل");
    setModal(null);
  };

  // Marking a specific delivery's fee as paid — updates the invoice directly,
  // since transport transaction data lives on the invoice itself.
  const markFeePaid = (invoiceId) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, transportFeePaid: true } : inv
      )
    );
    showToast("✅ تم تسجيل دفع الأجرة");
  };

  const toggleStatus = (person) => {
    setTransportPersons(
      transportPersons.map((t) =>
        t.id === person.id
          ? { ...t, status: t.status === "active" ? "inactive" : "active" }
          : t
      )
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">🚚 عمال النقل</h2>
        <Btn
          color="blue"
          onClick={() =>
            setModal(
              <AddTransportModal
                onSave={addPerson}
                onClose={() => setModal(null)}
              />
            )
          }
        >
          + إضافة عامل نقل
        </Btn>
      </div>
      <Card>
        <Table
          cols={[
            "الاسم",
            "الهاتف",
            "العنوان",
            "الحالة",
            "عدد التوصيلات",
            "الرصيد المستحق له",
            "",
            ""
          ]}
          rows={transportPersons.map((t) => {
            const stats = transportStatsFor(invoices, t.id);
            return [
              t.name,
              t.phone || "—",
              t.address || "—",
              t.status === "active" ? (
                <Badge color="green">نشط</Badge>
              ) : (
                <Badge color="gray">غير نشط</Badge>
              ),
              stats.totalJobs,
              <span
                className={`font-semibold ${stats.outstanding > 0 ? "text-red-600" : "text-gray-400"}`}
              >
                {fmt(stats.outstanding)}
              </span>,
              <Btn
                small
                color="gray"
                onClick={() =>
                  setModal(
                    <TransportPersonDetail
                      person={t}
                      invoices={invoices}
                      onMarkPaid={markFeePaid}
                      onClose={() => setModal(null)}
                    />
                  )
                }
              >
                السجل
              </Btn>,
              <Btn
                small
                color={t.status === "active" ? "red" : "green"}
                onClick={() => toggleStatus(t)}
              >
                {t.status === "active" ? "تعطيل" : "تفعيل"}
              </Btn>
            ];
          })}
        />
      </Card>
    </div>
  );
}
