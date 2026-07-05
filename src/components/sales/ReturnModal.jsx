import { useState, useMemo } from "react";
import { Modal, Select, Input, Btn } from "../ui";
import { fmt } from "../../utils/format";

export function ReturnModal({
  products,
  customers,
  invoices,
  onSave,
  showToast,
  processing,
  onClose
}) {
  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  const product = products.find((p) => p.id === productId);
  const refundAmount = product
    ? (parseFloat(qty) || 0) * (product.sellPrice || 0)
    : 0;

  const customerInvoices = invoices.filter(
    (i) => i.partyId === customerId && i.type === "sale"
  );

  // How much of this exact product this customer has ever bought, minus
  // what's already been returned — used as a soft sanity check.
  const maxReturnableQty = useMemo(() => {
    if (!customerId || !productId) return null;
    const sold = customerInvoices.reduce((sum, inv) => {
      const item = (inv.items || []).find((it) => it.productId === productId);
      return sum + (item ? parseFloat(item.qty) || 0 : 0);
    }, 0);
    const customer = customers.find((c) => c.id === customerId);
    const alreadyReturned = (customer?.returns || [])
      .filter((r) => r.productId === productId)
      .reduce((sum, r) => sum + (r.qty || 0), 0);
    return Math.max(0, sold - alreadyReturned);
  }, [customerId, productId, customerInvoices, customers]);

  const exceedsSold =
    maxReturnableQty !== null && (parseFloat(qty) || 0) > maxReturnableQty;

  const handleSave = () => {
    if (!customerId) return showToast("يجب اختيار العميل");
    if (!productId || (parseFloat(qty) || 0) <= 0)
      return showToast("اختر الصنف والكمية");
    if (exceedsSold)
      return showToast(
        `الكمية أكبر من المباع فعلياً لهذا العميل (الحد الأقصى: ${maxReturnableQty})`
      );
    onSave({
      customerId,
      productId,
      qty: parseFloat(qty),
      refundAmount,
      note,
      invoiceId: invoiceId || null
    });
  };

  return (
    <Modal title="🔄 تسجيل مرتجع" onClose={onClose}>
      <Select
        label="العميل"
        value={customerId}
        onChange={(e) => {
          setCustomerId(e.target.value);
          setInvoiceId("");
        }}
      >
        <option value="">اختر العميل...</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      {customerId && (
        <Select
          label="الفاتورة (اختياري)"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
        >
          <option value="">بدون ربط بفاتورة</option>
          {customerInvoices.map((i) => (
            <option key={i.id} value={i.id}>
              {i.id.slice(-6).toUpperCase()} — {i.date.slice(0, 10)}
            </option>
          ))}
        </Select>
      )}

      <Select
        label="الصنف"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      >
        <option value="">اختر الصنف...</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>

      <Input
        label="الكمية المرتجعة"
        type="number"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="0"
      />

      {maxReturnableQty !== null && (
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          الحد الأقصى القابل للإرجاع لهذا العميل من هذا الصنف:{" "}
          <b>{maxReturnableQty}</b>
        </div>
      )}

      {exceedsSold && (
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
          الكمية أكبر من الكمية المباعة فعلياً لهذا العميل
        </div>
      )}

      {product && !exceedsSold && (
        <div
          style={{
            fontSize: 13,
            background: "#f0fdf4",
            color: "#16a34a",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 10
          }}
        >
          سيتم إضافة <b>{fmt(refundAmount)}</b> إلى رصيد العميل، وإعادة{" "}
          {qty || 0} {product.unit} إلى المخزون.
        </div>
      )}

      <Input
        label="سبب المرتجع (اختياري)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="مثال: عيب في المنتج"
      />

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose} disabled={processing}>
          إلغاء
        </Btn>
        <Btn
          color="green"
          onClick={handleSave}
          disabled={processing || exceedsSold}
        >
          {processing ? "جارٍ التسجيل..." : "تأكيد المرتجع"}
        </Btn>
      </div>
    </Modal>
  );
}
