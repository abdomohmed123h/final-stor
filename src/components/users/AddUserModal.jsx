import { useState } from "react";
import { Modal, Input, Select, Btn } from "../ui";
import { ROLES } from "../../constants/roles";

export function AddUserModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "salesman" });

  return (
    <Modal title="إضافة مستخدم جديد" onClose={onClose}>
      <Input label="الاسم الكامل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="اسم المستخدم" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <Input label="كلمة المرور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <Select label="الدور" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
        {Object.entries(ROLES).map(([key, roleLabel]) => (
          <option key={key} value={key}>
            {roleLabel}
          </option>
        ))}
      </Select>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>
          إلغاء
        </Btn>
        <Btn color="blue" onClick={() => form.name && form.username && form.password && onSave(form)}>
          إضافة
        </Btn>
      </div>
    </Modal>
  );
}
