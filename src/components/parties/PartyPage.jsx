import { Card, Table, Btn } from "../ui";
import { AddPartyModal } from "./AddPartyModal";
import { PartyDetail } from "./PartyDetail";
import { PaymentModal } from "./PaymentModal";

import { fmt, uid, now } from "../../utils/format";
import { invoicesForParty, debtFor, creditFor } from "../../utils/calculations";

export function PartyPage({
  type,
  parties,
  setParties,
  invoices,
  showToast,
  setModal,
  treasuryBalance
}) {
  const isCustomer = type === "customer";
  const label = isCustomer ? "العميل" : "المورد";
  const labelPlural = isCustomer ? "العملاء" : "الموردون";
  const icon = isCustomer ? "👥" : "🏭";

  const addParty = (form) => {
    setParties([
      ...parties,
      {
        id: uid(),
        ...form,
        payments: [],
        withdrawals: [],
        returns: [],
        createdAt: now()
      }
    ]);
    showToast(`✅ تم إضافة ${label}`);
    setModal(null);
  };

  const recordPayment = (party, amount, note) => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return showToast("أدخل مبلغاً صحيحاً");

    // دفعة لمورد = فلوس خارجة من الخزنة، لازم نتأكد إن فيه رصيد كافي
    if (!isCustomer && amt > treasuryBalance) {
      return showToast(
        `⚠️ لا يوجد رصيد كافٍ في الخزينة (المتاح: ${fmt(treasuryBalance)})`
      );
    }

    const payment = { id: uid(), amount: amt, note: note || "", date: now() };
    setParties(
      parties.map((p) =>
        p.id === party.id
          ? { ...p, payments: [...(p.payments || []), payment] }
          : p
      )
    );
    showToast(`✅ تم تسجيل دفعة ${fmt(amt)} من ${party.name}`);
    setModal(null);
  };

  const recordWithdrawal = (party, amount, note) => {
    const amt = parseFloat(amount) || 0;
    const available = creditFor(
      invoices,
      party.id,
      party.payments || [],
      party.withdrawals || [],
      party.returns || []
    );
    if (amt <= 0) return showToast("أدخل مبلغاً صحيحاً");
    if (amt > available)
      return showToast(`لا يمكن السحب — الرصيد المتاح ${fmt(available)} فقط`);

    // سحب/استرجاع لعميل = فلوس خارجة من الخزنة، لازم نتأكد إن فيه رصيد كافي
    if (isCustomer && amt > treasuryBalance) {
      return showToast(
        `⚠️ لا يوجد رصيد كافٍ في الخزينة (المتاح: ${fmt(treasuryBalance)})`
      );
    }

    const withdrawal = {
      id: uid(),
      amount: amt,
      note: note || "",
      date: now()
    };
    setParties(
      parties.map((p) =>
        p.id === party.id
          ? { ...p, withdrawals: [...(p.withdrawals || []), withdrawal] }
          : p
      )
    );
    showToast(`✅ تم سحب ${fmt(amt)} لـ ${party.name}`);
    setModal(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          {icon} {labelPlural}
        </h2>
        <Btn
          color="blue"
          onClick={() =>
            setModal(
              <AddPartyModal
                label={label}
                onSave={addParty}
                onClose={() => setModal(null)}
              />
            )
          }
        >
          + إضافة {label}
        </Btn>
      </div>
      <Card>
        <Table
          cols={[
            "الاسم",
            "الهاتف",
            "العنوان",
            "الرصيد المستحق",
            "رصيد علي المخزن",
            "عدد الفواتير",
            "",
            "",
            "",
            "سحب فلوس العميل"
          ]}
          rows={parties.map((p) => {
            const debt = debtFor(
              invoices,
              p.id,
              p.payments || [],
              p.returns || []
            );
            const credit = creditFor(
              invoices,
              p.id,
              p.payments || [],
              p.withdrawals || [],
              p.returns || []
            );
            const partyInvoices = invoicesForParty(invoices, p.id);
            return [
              p.name,
              p.phone || "—",
              p.address || "—",
              <span
                className={`font-semibold ${debt > 0 ? "text-red-600" : "text-gray-400"}`}
              >
                {fmt(debt)}
              </span>,
              <span
                className={`font-semibold ${credit > 0 ? "text-blue-600" : "text-gray-400"}`}
              >
                {fmt(credit)}
              </span>,
              partyInvoices.length,
              <Btn
                small
                color="gray"
                onClick={() =>
                  setModal(
                    <PartyDetail
                      party={p}
                      invoices={partyInvoices}
                      payments={p.payments || []}
                      withdrawals={p.withdrawals || []}
                      returns={p.returns || []}
                      onClose={() => setModal(null)}
                    />
                  )
                }
              >
                التفاصيل
              </Btn>,
              <Btn
                small
                color="purple"
                onClick={() =>
                  setModal(
                    <PartyDetail
                      party={p}
                      invoices={partyInvoices}
                      payments={p.payments || []}
                      withdrawals={p.withdrawals || []}
                      returns={p.returns || []}
                      onClose={() => setModal(null)}
                    />
                  )
                }
              >
                سجل الحساب
              </Btn>,
              <Btn
                small
                color="green"
                onClick={() =>
                  setModal(
                    <PaymentModal
                      party={p}
                      onSave={recordPayment}
                      onClose={() => setModal(null)}
                    />
                  )
                }
              >
                دفعة
              </Btn>,
              credit > 0 ? (
                <Btn
                  small
                  color="blue"
                  onClick={() =>
                    setModal(
                      <PaymentModal
                        party={p}
                        title={`سحب فلوس — ${p.name}`}
                        maxAmount={credit}
                        onSave={recordWithdrawal}
                        onClose={() => setModal(null)}
                      />
                    )
                  }
                >
                  سحب فلوس
                </Btn>
              ) : (
                <span className="text-gray-300 text-xs">—</span>
              )
            ];
          })}
        />
      </Card>
    </div>
  );
}
