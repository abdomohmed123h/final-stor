import { Card, Table, Badge, Btn } from "../ui";
import { AddUserModal } from "./AddUserModal";
import { ROLES, ROLE_BADGE_COLOR } from "../../constants/roles";
import { uid } from "../../utils/format";

export function UsersPage({ users, setUsers, showToast, setModal, currentUser }) {
  const addUser = (form) => {
    setUsers([...users, { id: uid(), ...form }]);
    showToast("✅ تم إضافة المستخدم");
    setModal(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>🔑 إدارة المستخدمين</h2>
        <Btn color="blue" onClick={() => setModal(<AddUserModal onSave={addUser} onClose={() => setModal(null)} />)}>
          + إضافة مستخدم
        </Btn>
      </div>
      <Card>
        <Table
          cols={["الاسم", "اسم المستخدم", "الدور", "", ""]}
          rows={users.map((u) => [
            u.name,
            u.username,
            <Badge color={ROLE_BADGE_COLOR[u.role]}>{ROLES[u.role]}</Badge>,
            u.id !== currentUser.id ? (
              <Btn
                small
                color="red"
                onClick={() => {
                  setUsers(users.filter((x) => x.id !== u.id));
                  showToast("تم حذف المستخدم");
                }}
              >
                حذف
              </Btn>
            ) : (
              <Badge color="green">أنت</Badge>
            ),
          ])}
        />
      </Card>
    </div>
  );
}
