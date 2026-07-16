import { Card, Table, Btn } from "../ui";
import { PurchasesInvoiceForm } from "./PurchasesInvoiceForm";
import { InvoicePreview } from "../invoices/InvoicePreview";
import { fmt, todayStr, uid, shortId, now } from "../../utils/format";
import { invoiceRemaining, invoicesOnDate } from "../../utils/calculations";

export function PurchasesPage({
  products,
  setProducts,
  suppliers,
  setSuppliers,
  invoices,
  setInvoices,
  employees,
  setEmployees,
  showToast,
  setModal,
  currentUser
}) {
  const handleSubmit = ({
    items,
    supplierId,
    total,
    paid,
    notes,
    employeeIds,
    loadingFee
  }) => {
    // Increase stock and refresh buy prices for purchased items.
    const updatedProducts = products.map((p) => {
      const item = items.find((i) => i.productId === p.id);
      return item
        ? {
            ...p,
            stock: p.stock + (parseFloat(item.qty) || 0),
            buyPrice: parseFloat(item.price) || p.buyPrice
          }
        : p;
    });
    setProducts(updatedProducts);

    const employeeNames = (employeeIds || [])
      .map((id) => employees.find((e) => e.id === id)?.name)
      .filter(Boolean);

    const invoice = {
      id: uid(),
      type: "purchase",
      date: new Date().toISOString(),
      partyId: supplierId || null,
      partyName: suppliers.find((s) => s.id === supplierId)?.name || "نقدي",
      items: items.map((item) => ({
        ...item,
        productName: products.find((p) => p.id === item.productId)?.name || ""
      })),
      total,
      paid,
      notes,
      createdBy: currentUser.name,
      employeeIds: employeeIds || [],
      employeeNames
    };
    setInvoices([...invoices, invoice]);

    // Unloading fee is split evenly across every selected worker and
    // credited to each employee's own balance -- it becomes an actual
    // expense only later, when the shop pays that employee out (same
    // pattern as SalesPage's loading fee).
    if (employeeIds?.length > 0 && loadingFee > 0) {
      const share = loadingFee / employeeIds.length;
      setEmployees(
        employees.map((emp) => {
          if (!employeeIds.includes(emp.id)) return emp;
          const earning = {
            id: uid(),
            amount: share,
            invoiceId: invoice.id,
            invoiceType: "purchase",
            note: `فاتورة شراء ${invoice.id.slice(-6).toUpperCase()}${employeeIds.length > 1 ? ` (مقسّمة على ${employeeIds.length} عمال)` : ""}`,
            date: now()
          };
          return { ...emp, earnings: [...(emp.earnings || []), earning] };
        })
      );
    }

    showToast("✅ تم تسجيل فاتورة الشراء");
    setModal(<InvoicePreview inv={invoice} onClose={() => setModal(null)} />);
  };

  const todayBuys = invoicesOnDate(invoices, "purchase", todayStr());

  return (
    <div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 16
        }}
      >
        🛒 تسجيل فاتورة شراء
      </h2>

      <PurchasesInvoiceForm
        products={products}
        suppliers={suppliers}
        setSuppliers={setSuppliers}
        setModal={setModal}
        employees={employees}
        onSubmit={handleSubmit}
        showToast={showToast}
      />

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          مشتريات اليوم ({todayBuys.length})
        </h3>
        <Table
          cols={[
            "رقم الفاتورة",
            "المورد",
            "الإجمالي",
            "مدفوع",
            "متبقي",
            "الوقت",
            ""
          ]}
          rows={todayBuys.map((inv) => [
            shortId(inv.id),
            inv.partyName,
            fmt(inv.total),
            fmt(inv.paid),
            <span
              style={{
                color: invoiceRemaining(inv) > 0 ? "#d97706" : "#16a34a"
              }}
            >
              {fmt(invoiceRemaining(inv))}
            </span>,
            new Date(inv.date).toLocaleTimeString("ar-EG"),
            <Btn
              small
              color="gray"
              onClick={() =>
                setModal(
                  <InvoicePreview inv={inv} onClose={() => setModal(null)} />
                )
              }
            >
              عرض
            </Btn>
          ])}
        />
      </Card>
    </div>
  );
}
