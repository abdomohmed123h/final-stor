import { useState } from "react";

// Manages the array of { productId, qty, price } line items shared by the
// Sales and Purchases invoice forms, including auto-filling the price when
// a product is selected (via `priceField`, e.g. "sellPrice" or "buyPrice").
export function useInvoiceItems(products, priceField) {
  const [items, setItems] = useState([{ productId: "", qty: 1, price: 0 }]);

  const addItem = () => setItems((prev) => [...prev, { productId: "", qty: 1, price: 0 }]);

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) updated[index].price = product[priceField];
      }
      return updated;
    });
  };

  const resetItems = () => setItems([{ productId: "", qty: 1, price: 0 }]);

  return { items, addItem, removeItem, updateItem, resetItems };
}
