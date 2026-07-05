import { Select, Input, Btn } from "../ui";

// Renders the editable list of line items (product / qty / price) shared by
// the Sales and Purchases forms. `priceField` picks whether selecting a
// product auto-fills the buy or sell price via `onProductSelect`.
export function InvoiceItemsEditor({ items, products, onAddItem, onRemoveItem, onUpdateItem, showAvailableStock = false, priceLabel = "السعر" }) {
  return (
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>الأصناف</h4>

      {items.map((item, index) => (
        <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
          <Select
            label={index === 0 ? "الصنف" : undefined}
            value={item.productId}
            onChange={(e) => onUpdateItem(index, "productId", e.target.value)}
          >
            <option value="">اختر صنفاً</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {showAvailableStock ? ` (متوفر: ${p.stock} ${p.unit})` : ""}
              </option>
            ))}
          </Select>

          <Input
            label={index === 0 ? "الكمية" : undefined}
            type="number"
            value={item.qty}
            onChange={(e) => onUpdateItem(index, "qty", e.target.value)}
          />

          <Input
            label={index === 0 ? priceLabel : undefined}
            type="number"
            value={item.price}
            onChange={(e) => onUpdateItem(index, "price", e.target.value)}
          />

          <Btn color="red" small onClick={() => onRemoveItem(index)} disabled={items.length === 1}>
            ✕
          </Btn>
        </div>
      ))}

      <Btn color="gray" onClick={onAddItem} small>
        + إضافة صنف
      </Btn>
    </div>
  );
}
