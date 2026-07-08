import { Input, Btn } from "../ui";
import { SearchableSelect } from "../ui/SearchableSelect";

export function InvoiceItemsEditor({
  items,
  products,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  showAvailableStock = false,
  priceLabel = "السعر"
}) {
  return (
    <div>
      <h4
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 8,
          color: "#374151"
        }}
      >
        الأصناف
      </h4>

      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: 8,
            marginBottom: 8,
            alignItems: "end"
          }}
        >
          <SearchableSelect
            label={index === 0 ? "الصنف" : undefined}
            value={item.productId}
            onChange={(id) => onUpdateItem(index, "productId", id)}
            options={products}
            placeholder="اختر صنفاً"
            emptyLabel="لا يوجد صنف مطابق"
            renderOption={(p) =>
              showAvailableStock
                ? `${p.name} (متوفر: ${p.stock} ${p.unit})`
                : p.name
            }
            renderSelected={(p) =>
              showAvailableStock
                ? `${p.name} (متوفر: ${p.stock} ${p.unit})`
                : p.name
            }
          />

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

          <Btn
            color="red"
            small
            onClick={() => onRemoveItem(index)}
            disabled={items.length === 1}
          >
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
