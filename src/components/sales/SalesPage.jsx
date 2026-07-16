import { useState } from "react";
import { Card, Table, Btn } from "../ui";
import { SalesInvoiceForm } from "./SalesInvoiceForm";
import { ReturnModal } from "./ReturnModal";
import { InvoicePreview } from "../invoices/InvoicePreview";
import { fmt, todayStr, uid, shortId, now } from "../../utils/format";
import { invoiceRemaining, invoicesOnDate } from "../../utils/calculations";

export function SalesPage({
  products,
  setProducts,
  customers,
  setCustomers,
  transportPersons = [],
  invoices,
  setInvoices,
  expenses,
  setExpenses,
  reservations = [],
  showToast,
  setModal,
  employees,
  currentUser
}) {
  const [processingReturn, setProcessingReturn] = useState(false);

  const handleSubmit = ({
    items,
    customerId,
    itemsTotal,
    transportFee,
    total,
    paid,
    notes,
    transportId,
    deliveryAddress,
    employeeIds,
    loadingFee
  }) => {
    const updatedProducts = products.map((p) => {
      const item = items.find((i) => i.productId === p.id);
      return item ? { ...p, stock: p.stock - (parseFloat(item.qty) || 0) } : p;
    });
    setProducts(updatedProducts);

    const transportPerson = transportId
      ? transportPersons.find((t) => t.id === transportId)
      : null;
    const employeeNames = (employeeIds || [])
      .map((id) => employees.find((e) => e.id === id)?.name)
      .filter(Boolean);

    const invoice = {
      id: uid(),
      type: "sale",
      date: new Date().toISOString(),
      partyId: customerId || null,
      partyName: customers.find((c) => c.id === customerId)?.name || "نقدي",
      items: items.map((item) => ({
        ...item,
        productName: products.find((p) => p.id === item.productId)?.name || ""
      })),
      itemsTotal,
      transportFee,
      total,
      paid,
      notes,
      createdBy: currentUser.name,
      transportId: transportId || null,
      transportPersonName: transportPerson?.name || "",
      deliveryAddress: deliveryAddress || "",
      transportFeePaid: false,
      employeeIds: employeeIds || [],
      employeeNames
    };
    setInvoices([...invoices, invoice]);

    // Loading fee is NOT part of the invoice -- it's a cost the shop pays its
    // own workers, recorded automatically as an expense, not charged to the customer.
    if (employeeIds?.length > 0 && loadingFee > 0) {
      const expense = {
        id: uid(),
        amount: loadingFee,
        category: "أجرة تحميل/تفريغ",
        note: `فاتورة بيع ${invoice.id.slice(-6).toUpperCase()} — عمال: ${employeeNames.join("، ")}`,
        date: now()
      };
      setExpenses([...expenses, expense]);
    }

    showToast("✅ تم تسجيل فاتورة البيع");
    setModal(<InvoicePreview inv={invoice} onClose={() => setModal(null)} />);
  };

  const handleReturn = ({
    customerId,
    productId,
    qty,
    refundAmount,
    note,
    invoiceId
  }) => {
    if (processingReturn) return;
    setProcessingReturn(true);
    try {
      const product = products.find((p) => p.id === productId);
      const customer = customers.find((c) => c.id === customerId);
      if (!product) throw new Error("الصنف غير موجود");
      if (!customer) throw new Error("العميل غير موجود");
      if (!qty || qty <= 0) throw new Error("كمية غير صحيحة");
      if (!refundAmount || refundAmount <= 0)
        throw new Error("قيمة المرتجع غير صحيحة");

      const returnRecord = {
        id: uid(),
        productId,
        productName: product.name,
        invoiceId: invoiceId || null,
        qty,
        amount: refundAmount,
        note: note || "",
        date: now()
      };
      const updatedProducts = products.map((p) =>
        p.id === productId ? { ...p, stock: p.stock + qty } : p
      );
      const updatedCustomers = customers.map((c) =>
        c.id === customerId
          ? { ...c, returns: [...(c.returns || []), returnRecord] }
          : c
      );

      setProducts(updatedProducts);
      setCustomers(updatedCustomers);
      showToast(
        `✅ تم تسجيل المرتجع وإضافة ${fmt(refundAmount)} لحساب ${customer.name}`
      );
      setModal(null);
    } catch (err) {
      showToast(`❌ فشل تسجيل المرتجع: ${err.message}`);
    } finally {
      setProcessingReturn(false);
    }
  };

  const todaySales = invoicesOnDate(invoices, "sale", todayStr());

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          🧾 تسجيل فاتورة بيع
        </h2>
        <Btn
          color="gray"
          onClick={() =>
            setModal(
              <ReturnModal
                products={products}
                customers={customers}
                invoices={invoices}
                onSave={handleReturn}
                showToast={showToast}
                processing={processingReturn}
                onClose={() => setModal(null)}
              />
            )
          }
        >
          🔄 تسجيل مرتجع
        </Btn>
      </div>

      <SalesInvoiceForm
        products={products}
        customers={customers}
        setCustomers={setCustomers}
        setModal={setModal}
        transportPersons={transportPersons}
        reservations={reservations}
        onSubmit={handleSubmit}
        showToast={showToast}
        employees={employees}
      />

      <Card>
        <h3 className="text-sm font-semibold mb-3">
          مبيعات اليوم ({todaySales.length})
        </h3>
        <Table
          cols={[
            "رقم الفاتورة",
            "العميل",
            "الإجمالي",
            "مدفوع",
            "متبقي",
            "النقل",
            "الوقت",
            ""
          ]}
          rows={todaySales.map((inv) => [
            shortId(inv.id),
            inv.partyName,
            fmt(inv.total),
            fmt(inv.paid),
            <span
              className={
                invoiceRemaining(inv) > 0 ? "text-red-600" : "text-green-600"
              }
            >
              {fmt(invoiceRemaining(inv))}
            </span>,
            inv.transportPersonName || "—",
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
