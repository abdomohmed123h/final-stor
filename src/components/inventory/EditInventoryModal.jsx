import { useState } from "react";
import { Modal, Input, Btn } from "../ui";

export function EditInventoryModal({ product, products, setProducts, showToast, onClose }) {
  const [form, setForm] = useState({ ...product });

  const handleSave = () => {
    setProducts(
      products.map((p) =>
        p.id === form.id
          ? {
              ...form,
              stock: parseFloat(form.stock) || 0,
              buyPrice: parseFloat(form.buyPrice) || 0,
              sellPrice: parseFloat(form.sellPrice) || 0,
              minStock: parseFloat(form.minStock) || 0,
            }
          : p
      )
    );
    showToast("✅ تم تحديث بيانات الصنف");
    onClose();
  };

  return (
    <Modal title={`تعديل: ${product.name}`} onClose={onClose}>
      <Input label="المخزون الحالي" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
      <Input label="سعر الشراء (ج.م)" type="number" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} />
      <Input label="سعر البيع (ج.م)" type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />
      <Input label="الحد الأدنى للتنبيه" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>
          إلغاء
        </Btn>
        <Btn color="green" onClick={handleSave}>
          حفظ
        </Btn>
      </div>
    </Modal>
  );
}
