import { useMemo } from "react";
import { useState } from "react";
import { Card, Table, Badge, Metric, Input, Select, Btn, Modal } from "../ui";
import { fmt, uid, now } from "../../utils/format";
import {
  getCashMovements,
  cashRegisterBalance,
  dailyCashHistory
} from "../../utils/calculations";
import {
  DEPOSIT_CATEGORIES,
  depositCategoryLabel
} from "../../constants/treasuryCategories";

function TreasuryDepositModal({ onSave, onClose }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(DEPOSIT_CATEGORIES[0].key);
  const [note, setNote] = useState("");
  const amt = parseFloat(amount) || 0;

  return (
    <Modal title="إيداع نقدي في الخزينة" onClose={onClose}>
      <Select
        label="نوع الإيداع"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {DEPOSIT_CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </Select>
      <Input
        label="المبلغ (ج.م)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
      />
      <Input
        label="ملاحظة (اختياري)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="تفاصيل إضافية..."
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          marginTop: 8
        }}
      >
        <Btn color="gray" onClick={onClose}>
          إلغاء
        </Btn>
        <Btn
          color="green"
          onClick={() => amt > 0 && onSave(amt, category, note)}
        >
          تأكيد الإيداع
        </Btn>
      </div>
    </Modal>
  );
}

function TreasuryWithdrawModal({ available, onSave, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const amt = parseFloat(amount) || 0;
  const exceedsMax = amt > available;

  return (
    <Modal title="سحب من الخزينة" onClose={onClose}>
      <div
        style={{
          fontSize: 13,
          background: "#f0f9ff",
          color: "#0369a1",
          borderRadius: 8,
          padding: "8px 12px",
          marginBottom: 10
        }}
      >
        الرصيد المتاح: <b>{fmt(available)}</b>
      </div>
      <Input
        label="المبلغ (ج.م)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
      />
      {exceedsMax && (
        <div
          style={{
            fontSize: 13,
            background: "#fef2f2",
            color: "#dc2626",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 10
          }}
        >
          المبلغ أكبر من رصيد الخزينة المتاح
        </div>
      )}
      <Input
        label="سبب السحب (اختياري)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="مثال: سحب شخصي، إيداع بنكي..."
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          marginTop: 8
        }}
      >
        <Btn color="gray" onClick={onClose}>
          إلغاء
        </Btn>
        <Btn
          color="red"
          onClick={() => amount && !exceedsMax && onSave(amt, note)}
        >
          تأكيد السحب
        </Btn>
      </div>
    </Modal>
  );
}

export function TreasuryPage({
  invoices,
  customers,
  suppliers,
  expenses,
  treasuryWithdrawals,
  setTreasuryWithdrawals,
  treasuryDeposits,
  setTreasuryDeposits,
  currentUser,
  showToast,
  setModal
}) {
  // Extra safety net: even though the nav item is admin-only, guard the
  // page itself in case it's ever reached another way.
  if (currentUser?.role !== "admin") {
    return (
      <div style={{ color: "#6b7280", padding: 20, textAlign: "center" }}>
        🔒 هذه الصفحة متاحة للمدير فقط.
      </div>
    );
  }

  const { balance, history } = useMemo(() => {
    const movements = getCashMovements(
      invoices,
      customers,
      suppliers,
      expenses,
      treasuryWithdrawals,
      treasuryDeposits
    );
    return {
      balance: cashRegisterBalance(movements),
      history: dailyCashHistory(movements)
    };
  }, [
    invoices,
    customers,
    suppliers,
    expenses,
    treasuryWithdrawals,
    treasuryDeposits
  ]);

  const handleDeposit = (amount, category, note) => {
    const deposit = {
      id: uid(),
      amount,
      category,
      note,
      date: now(),
      by: currentUser?.name || ""
    };
    setTreasuryDeposits([...treasuryDeposits, deposit]);
    showToast(`✅ تم تسجيل إيداع ${fmt(amount)}`);
    setModal(null);
  };

  const handleWithdraw = (amount, note) => {
    const withdrawal = {
      id: uid(),
      amount,
      note,
      date: now(),
      by: currentUser?.name || ""
    };
    setTreasuryWithdrawals([...treasuryWithdrawals, withdrawal]);
    showToast(`✅ تم سحب ${fmt(amount)} من الخزينة`);
    setModal(null);
  };

  const ledger = [
    ...treasuryDeposits.map((d) => ({ ...d, kind: "deposit" })),
    ...treasuryWithdrawals.map((w) => ({ ...w, kind: "withdrawal" }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 16
        }}
      >
        💰 الخزينة
      </h2>

      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Metric
          label="رصيد الخزينة الحالي"
          value={fmt(balance)}
          color={balance >= 0 ? "#0891b2" : "#dc2626"}
        />
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>إدارة الخزينة</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              color="green"
              onClick={() =>
                setModal(
                  <TreasuryDepositModal
                    onSave={handleDeposit}
                    onClose={() => setModal(null)}
                  />
                )
              }
            >
              💵 إيداع نقدي
            </Btn>
            <Btn
              color="red"
              onClick={() =>
                setModal(
                  <TreasuryWithdrawModal
                    available={balance}
                    onSave={handleWithdraw}
                    onClose={() => setModal(null)}
                  />
                )
              }
            >
              💸 سحب من الخزينة
            </Btn>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>
          الإيداع يستخدم لتسجيل أي فلوس داخلة للخزينة من خارج نشاط البيع والشراء
          العادي (قرض بنكي، توسعات، رأس مال من الأونر...). السحب يستخدم لإخراج
          فلوس من الخزينة لأي غرض.
        </div>
      </Card>

      <Card>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          السجل اليومي للخزينة
        </h4>
        {history.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
              padding: "24px 0"
            }}
          >
            لا توجد حركات نقدية بعد
          </div>
        ) : (
          <Table
            cols={["التاريخ", "صافي اليوم", "رصيد الخزينة في نهاية اليوم"]}
            rows={[...history].reverse().map((h) => [
              h.date,
              <span
                style={{
                  color: h.netOfDay >= 0 ? "#16a34a" : "#dc2626",
                  fontWeight: 600
                }}
              >
                {fmt(h.netOfDay)}
              </span>,
              <span style={{ fontWeight: 700 }}>{fmt(h.balanceEndOfDay)}</span>
            ])}
          />
        )}
      </Card>

      <Card>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          سجل الإيداعات والسحوبات ({ledger.length})
        </h4>
        {ledger.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
              padding: "24px 0"
            }}
          >
            لا توجد عمليات إيداع أو سحب بعد
          </div>
        ) : (
          <Table
            cols={["التاريخ", "النوع", "المبلغ", "التفاصيل", "بواسطة"]}
            rows={ledger.map((t) => [
              new Date(t.date).toLocaleDateString("ar-EG"),
              t.kind === "deposit" ? (
                <Badge color="green">إيداع</Badge>
              ) : (
                <Badge color="red">سحب</Badge>
              ),
              <span
                style={{
                  color: t.kind === "deposit" ? "#16a34a" : "#dc2626",
                  fontWeight: 600
                }}
              >
                {fmt(t.amount)}
              </span>,
              t.kind === "deposit"
                ? `${depositCategoryLabel(t.category)}${t.note ? " — " + t.note : ""}`
                : t.note || "—",
              t.by || "—"
            ])}
          />
        )}
      </Card>
    </div>
  );
}
