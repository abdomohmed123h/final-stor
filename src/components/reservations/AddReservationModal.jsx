import { useState } from "react";
import { Modal, Select, Input, Btn } from "../ui";
import { HoverMetricCard } from "../ui/HoverMetricCard";
import { fmt } from "../../utils/format";
import { creditFor } from "../../utils/calculations";

export function AddReservationModal({
  products,
  customers,
  invoices,
  onSave,
  onClose,
  showToast
}) {
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [paid, setPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [useCredit, setUseCredit] = useState(false);

  const product = products.find((p) => p.id === productId);
  const customer = customers.find((c) => c.id === customerId);
  const total = (parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0);

  const availableCredit = customer
    ? creditFor(
        invoices,
        customer.id,
        customer.payments || [],
        customer.withdrawals || [],
        customer.returns || []
      )
    : 0;
  const creditApplied = useCredit ? Math.min(availableCredit, total) : 0;
  const remaining = total - creditApplied - (parseFloat(paid) || 0);

  const handleProductChange = (id) => {
    setProductId(id);
    const p = products.find((pr) => pr.id === id);
    if (p) setUnitPrice(p.sellPrice || "");
  };

  const handleSave = () => {
    if (!customerId) return showToast("اختر العميل");
    if (!productId) return showToast("اختر المنتج");
    if (!qty || parseFloat(qty) <= 0) return showToast("أدخل كمية صحيحة");

    const cashPaid = parseFloat(paid) || 0;
    const maxCash = Math.max(total - creditApplied, 0);
    if (cashPaid > maxCash) {
      return showToast(
        `المبلغ المدفوع نقداً أكبر من المطلوب. الحد الأقصى المسموح: ${fmt(maxCash)} (بعد خصم الرصيد المستخدم ${fmt(creditApplied)})`
      );
    }

    onSave({
      customerId,
      productId,
      qty: parseFloat(qty),
      unitPrice: parseFloat(unitPrice) || 0,
      total,
      paid: cashPaid,
      creditUsed: creditApplied,
      notes
    });
  };

  return (
    <Modal title="📦 حجز جديد" onClose={onClose}>
      <Select
        label="العميل"
        value={customerId}
        onChange={(e) => {
          setCustomerId(e.target.value);
          setUseCredit(false);
        }}
      >
        <option value="">اختر العميل...</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      {customer && availableCredit > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-3 text-sm flex items-center justify-between">
          <span>
            رصيد العميل المتاح: <b>{fmt(availableCredit)}</b>
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useCredit}
              onChange={(e) => setUseCredit(e.target.checked)}
            />
            استخدام الرصيد
          </label>
        </div>
      )}

      <Select
        label="المنتج"
        value={productId}
        onChange={(e) => handleProductChange(e.target.value)}
      >
        <option value="">اختر المنتج...</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} (متاح: {p.stock} {p.unit})
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`الكمية${product ? ` (${product.unit})` : ""}`}
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <Input
          label="سعر الوحدة (ج.م)"
          type="number"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <HoverMetricCard
          label="إجمالي قيمة الحجز"
          value={total}
          color="#2563eb"
          details={{
            title: "تفاصيل الحساب",
            rows: [
              { label: "الكمية", value: `${qty || 0} ${product?.unit || ""}` },
              { label: "سعر الوحدة", value: fmt(parseFloat(unitPrice) || 0) },
              ...(creditApplied > 0
                ? [
                    {
                      label: "من رصيد العميل",
                      value: fmt(creditApplied),
                      color: "#16a34a"
                    }
                  ]
                : [])
            ]
          }}
        />
      </div>

      {creditApplied > 0 && (
        <div className="text-xs text-green-600 mb-2">
          تم خصم {fmt(creditApplied)} من رصيد العميل المتاح
        </div>
      )}

      <Input
        label="المبلغ المدفوع نقداً (اختياري)"
        type="number"
        value={paid}
        onChange={(e) => setPaid(e.target.value)}
        placeholder="0"
      />

      {(parseFloat(paid) > 0 || creditApplied > 0) && (
        <div className="text-xs text-gray-500 mb-2">
          المتبقي: {fmt(remaining)}
        </div>
      )}

      <Input
        label="ملاحظات"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="ملاحظات اختيارية"
      />

      <div className="flex gap-2 justify-end mt-2">
        <Btn color="gray" onClick={onClose}>
          إلغاء
        </Btn>
        <Btn color="blue" onClick={handleSave}>
          حفظ الحجز
        </Btn>
      </div>
    </Modal>
  );
}
