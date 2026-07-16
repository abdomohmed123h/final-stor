import { Card, Table, Btn, Badge } from "../ui";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { uid, now } from "../../utils/format";
import { employeeStatsFor } from "../../utils/calculations";

export function EmployeesPage({
  employees,
  setEmployees,
  invoices,
  showToast,
  setModal
}) {
  const addEmployee = (form) => {
    setEmployees([...employees, { id: uid(), ...form, createdAt: now() }]);
    showToast("✅ تم إضافة العامل");
    setModal(null);
  };

  const toggleStatus = (emp) => {
    setEmployees(
      employees.map((e) =>
        e.id === emp.id
          ? { ...e, status: e.status === "active" ? "inactive" : "active" }
          : e
      )
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          👷 عمال التحميل والتفريغ
        </h2>
        <Btn
          color="blue"
          onClick={() =>
            setModal(
              <AddEmployeeModal
                onSave={addEmployee}
                onClose={() => setModal(null)}
              />
            )
          }
        >
          + إضافة عامل
        </Btn>
      </div>
      <Card>
        <Table
          cols={[
            "الاسم",
            "الهاتف",
            "الحالة",
            "مرات التحميل (بيع)",
            "مرات التفريغ (شراء)",
            "إجمالي المهام",
            ""
          ]}
          rows={employees.map((e) => {
            const stats = employeeStatsFor(invoices, e.id);
            return [
              e.name,
              e.phone || "—",
              e.status === "active" ? (
                <Badge color="green">نشط</Badge>
              ) : (
                <Badge color="gray">غير نشط</Badge>
              ),
              stats.loadingJobs,
              stats.unloadingJobs,
              stats.totalJobs,
              <Btn
                small
                color={e.status === "active" ? "red" : "green"}
                onClick={() => toggleStatus(e)}
              >
                {e.status === "active" ? "تعطيل" : "تفعيل"}
              </Btn>
            ];
          })}
        />
      </Card>
    </div>
  );
}
