import { useState } from "react";
import { Modal, Input, Btn } from "../ui";

export function AddProductModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", unit: "شيكارة", stock: 0, buyPrice: 0, sellPrice: 0, minStock: 0 });

  return (
    <Modal title="إضافة صنف جديد" onClose={onClose}>
      <Input label="اسم الصنف" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: أسمنت، حديد..." />
      <Input label="وحدة القياس" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="شيكارة، طن، متر..." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="المخزون الابتدائي" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <Input label="الحد الأدنى للتنبيه" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
        <Input label="سعر الشراء (ج.م)" type="number" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} />
        <Input label="سعر البيع (ج.م)" type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>
          إلغاء
        </Btn>
        <Btn color="blue" onClick={() => form.name && onSave(form)}>
          إضافة
        </Btn>
      </div>
    </Modal>
  );
}
