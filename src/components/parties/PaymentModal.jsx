import { useState } from "react";
import { Modal, Input, Btn } from "../ui";
import { fmt } from "../../utils/format";

export function PaymentModal({
  party,
  title,
  maxAmount = null,
  onSave,
  onClose
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const isWithdrawal = maxAmount !== null;
  const modalTitle = title || `تسجيل دفعة — ${party.name}`;
  const btnLabel = isWithdrawal ? "تأكيد السحب" : "تأكيد الدفعة";

  const amt = parseFloat(amount) || 0;
  const exceedsMax = isWithdrawal && amt > maxAmount;

  return (
    <Modal title={modalTitle} onClose={onClose}>
      {isWithdrawal && (
        <div className="mb-3 text-sm bg-blue-50 text-blue-700 rounded-lg p-2.5">
          الرصيد المتاح للسحب: <b>{fmt(maxAmount)}</b>
        </div>
      )}

      <Input
        label="المبلغ (ج.م)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
      />

      {exceedsMax && (
        <div className="mb-3 text-sm bg-red-50 text-red-600 rounded-lg p-2.5">
          المبلغ أكبر من الرصيد المتاح ({fmt(maxAmount)})
        </div>
      )}

      <Input
        label="ملاحظة"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex gap-2 justify-end">
        <Btn color="gray" onClick={onClose}>
          إلغاء
        </Btn>
        <Btn
          color={isWithdrawal ? "blue" : "green"}
          onClick={() => amount && !exceedsMax && onSave(party, amount, note)}
        >
          {btnLabel}
        </Btn>
      </div>
    </Modal>
  );
}
