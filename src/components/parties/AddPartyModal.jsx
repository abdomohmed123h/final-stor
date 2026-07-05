import { useState } from "react";
import { Modal, Input, Btn } from "../ui";

export function AddPartyModal({ label, onSave, onClose }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });

  return (
    <Modal title={`إضافة ${label} جديد`} onClose={onClose}>
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
        label="العنوان"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <Input
        label="ملاحظات"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
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
