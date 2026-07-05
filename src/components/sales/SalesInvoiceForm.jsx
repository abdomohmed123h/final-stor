import { useState } from "react";
import { Card, Select, Input, Btn } from "../ui";
import { InvoiceItemsEditor } from "../shared/InvoiceItemsEditor";
import { fmt } from "../../utils/format";
import { calcItemsTotal } from "../../utils/calculations";
import { useInvoiceItems } from "../../hooks/useInvoiceItems";

export function SalesInvoiceForm({
  products,
  customers,
  transportPersons = [],
  onSubmit,
  showToast
}) {
  const { items, addItem, removeItem, updateItem, resetItems } =
    useInvoiceItems(products, "sellPrice");
  const [customerId, setCustomerId] = useState("");
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const [transportId, setTransportId] = useState("");
  const [transportFee, setTransportFee] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const itemsTotal = calcItemsTotal(items);
  const transportFeeValue = transportId ? parseFloat(transportFee) || 0 : 0;

  // Grand total now includes transport fee, so it's visible everywhere the
  // invoice total is displayed/printed — not hidden as a separate field.
  const total = itemsTotal + transportFeeValue;
  const remaining = total - (parseFloat(paid) || 0);

  const activeTransportPersons = transportPersons.filter(
    (t) => t.status !== "inactive"
  );

  const handleSubmit = () => {
    if (!customerId) {
      showToast("يجب اختيار العميل قبل تسجيل الفاتورة");
      return;
    }
    if (!items[0].productId) {
      showToast("اختر صنفاً على الأقل");
      return;
    }
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      if ((parseFloat(item.qty) || 0) > product.stock) {
        showToast(`المخزون غير كافٍ للصنف: ${product.name}`);
        return;
      }
    }
    if (transportId && transportFeeValue <= 0) {
      showToast("أدخل قيمة أجرة النقل");
      return;
    }

    onSubmit({
      items,
      customerId,
      itemsTotal,
      transportFee: transportFeeValue,
      total,
      paid: parseFloat(paid) || 0,
      notes,
      transportId: transportId || null,
      deliveryAddress: transportId ? deliveryAddress : ""
    });

    resetItems();
    setCustomerId("");
    setPaid(0);
    setNotes("");
    setTransportId("");
    setTransportFee("");
    setDeliveryAddress("");
  };

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Select
          label="العميل *"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">اختر العميل...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <div />
      </div>

      <InvoiceItemsEditor
        items={items}
        products={products}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateItem={updateItem}
        showAvailableStock
        priceLabel="سعر البيع"
      />

      <div className="border-t border-gray-100 mt-3 pt-3">
        <div className="text-xs font-semibold text-gray-500 mb-2">
          🚚 النقل (اختياري)
        </div>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <Select
            label="عامل النقل"
            value={transportId}
            onChange={(e) => setTransportId(e.target.value)}
          >
            <option value="">بدون نقل</option>
            {activeTransportPersons.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          {transportId && (
            <Input
              label="أجرة النقل (ج.م)"
              type="number"
              value={transportFee}
              onChange={(e) => setTransportFee(e.target.value)}
              placeholder="0"
            />
          )}
        </div>
        {transportId && (
          <Input
            label="عنوان التوصيل"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="عنوان التوصيل"
          />
        )}
      </div>

      <div className="border-t border-gray-200 mt-3.5 pt-3.5">
        {/* Price breakdown — shows the two components that make up the total. */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>إجمالي الأصناف:</span>
            <span className="font-semibold">{fmt(itemsTotal)}</span>
          </div>
          {transportId && (
            <div className="flex justify-between text-gray-600">
              <span>أجرة النقل:</span>
              <span className="font-semibold">{fmt(transportFeeValue)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-lg p-2.5 text-center">
            <div className="text-[11px] text-gray-500">الإجمالي الكلي</div>
            <div className="text-lg font-bold text-green-600">{fmt(total)}</div>
          </div>
          <Input
            label="المبلغ المدفوع (ج.م)"
            type="number"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
          />
          <div
            className={`rounded-lg p-2.5 text-center ${remaining > 0 ? "bg-red-50" : "bg-green-50"}`}
          >
            <div className="text-[11px] text-gray-500">المتبقي (دين)</div>
            <div
              className={`text-lg font-bold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {fmt(remaining)}
            </div>
          </div>
        </div>
        <Input
          label="ملاحظات"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات اختيارية"
        />
        <div className="mt-2">
          <Btn color="green" onClick={handleSubmit}>
            ✅ تسجيل الفاتورة
          </Btn>
        </div>
      </div>
    </Card>
  );
}
