import { useState } from "react";
import { Modal, Input, Select, Btn } from "../ui";

export function AddTransportModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    status: "active"
  });

  return (
    <Modal title="إضافة عامل نقل جديد" onClose={onClose}>
      <Input
        label="الاسم"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="رقم الهاتف"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <Input
        label="العنوان (اختياري)"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <Select
        label="الحالة"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
      >
        <option value="active">نشط</option>
        <option value="inactive">غير نشط</option>
      </Select>
      <div className="flex gap-2 justify-end">
        <Btn color="gray" onClick={onClose}>
          إلغاء
        </Btn>
        <Btn color="blue" onClick={() => form.name && onSave(form)}>
          حفظ
        </Btn>
      </div>
    </Modal>
  );
}
