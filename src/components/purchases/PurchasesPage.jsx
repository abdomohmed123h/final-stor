import { Card, Table, Btn } from "../ui";
import { PurchasesInvoiceForm } from "./PurchasesInvoiceForm";
import { InvoicePreview } from "../invoices/InvoicePreview";
import { fmt, todayStr, uid, shortId } from "../../utils/format";
import { invoiceRemaining, invoicesOnDate } from "../../utils/calculations";

export function PurchasesPage({
  products,
  setProducts,
  suppliers,
  invoices,
  setInvoices,
  showToast,
  setModal,
  currentUser
}) {
  const handleSubmit = ({ items, supplierId, total, paid, notes }) => {
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
      createdBy: currentUser.name
    };
    setInvoices([...invoices, invoice]);
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
