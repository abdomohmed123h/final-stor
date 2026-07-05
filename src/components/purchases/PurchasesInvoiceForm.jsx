import { useState } from "react";
import { Card, Select, Input, Btn } from "../ui";
import { InvoiceItemsEditor } from "../shared/InvoiceItemsEditor";
import { fmt } from "../../utils/format";
import { calcItemsTotal } from "../../utils/calculations";
import { useInvoiceItems } from "../../hooks/useInvoiceItems";

export function PurchasesInvoiceForm({
  products,
  suppliers,
  onSubmit,
  showToast
}) {
  const { items, addItem, removeItem, updateItem, resetItems } =
    useInvoiceItems(products, "buyPrice");
  const [supplierId, setSupplierId] = useState("");
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const total = calcItemsTotal(items);
  const remaining = total - (parseFloat(paid) || 0);

  const handleSubmit = () => {
    if (!items[0].productId) {
      showToast("اختر صنفاً على الأقل");
      return;
    }

    onSubmit({ items, supplierId, total, paid: parseFloat(paid) || 0, notes });
    resetItems();
    setPaid(0);
    setNotes("");
  };

  return (
    <Card>
      <Select
        label="المورد (اختياري)"
        value={supplierId}
        onChange={(e) => setSupplierId(e.target.value)}
      >
        <option value="">نقدي / غير محدد</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      <InvoiceItemsEditor
        items={items}
        products={products}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateItem={updateItem}
        priceLabel="سعر الشراء"
      />

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          marginTop: 14,
          paddingTop: 14
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12
          }}
        >
          <div
            style={{
              background: "#fef2f2",
              borderRadius: 8,
              padding: 10,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 11, color: "#6b7280" }}>الإجمالي</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>
              {fmt(total)}
            </div>
          </div>
          <Input
            label="المبلغ المدفوع (ج.م)"
            type="number"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
          />
          <div
            style={{
              background: remaining > 0 ? "#fffbeb" : "#f0fdf4",
              borderRadius: 8,
              padding: 10,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              المتبقي (مستحق)
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: remaining > 0 ? "#d97706" : "#16a34a"
              }}
            >
              {fmt(remaining)}
            </div>
          </div>
        </div>
        <Input
          label="ملاحظات"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات اختيارية"
        />
        <div style={{ marginTop: 8 }}>
          <Btn color="blue" onClick={handleSubmit}>
            ✅ تسجيل الفاتورة
          </Btn>
        </div>
      </div>
    </Card>
  );
}
