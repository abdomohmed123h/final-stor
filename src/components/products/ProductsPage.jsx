import { Card, Table, Btn } from "../ui";
import { AddProductModal } from "./AddProductModal";
import { EditProductModal } from "./EditProductModal";
import { fmt, uid } from "../../utils/format";
import { calcMargin } from "../../utils/calculations";

export function ProductsPage({ products, setProducts, showToast, setModal }) {
  const addProduct = (form) => {
    setProducts([
      ...products,
      {
        id: uid(),
        ...form,
        stock: parseFloat(form.stock) || 0,
        buyPrice: parseFloat(form.buyPrice) || 0,
        sellPrice: parseFloat(form.sellPrice) || 0,
        minStock: parseFloat(form.minStock) || 0,
      },
    ]);
    showToast("✅ تم إضافة الصنف");
    setModal(null);
  };

  const deleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
    showToast("تم حذف الصنف");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>🧱 إدارة الأصناف</h2>
        <Btn color="blue" onClick={() => setModal(<AddProductModal onSave={addProduct} onClose={() => setModal(null)} />)}>
          + إضافة صنف
        </Btn>
      </div>
      <Card>
        <Table
          cols={["الصنف", "الوحدة", "المخزون", "سعر الشراء", "سعر البيع", "هامش الربح", "الحد الأدنى", ""]}
          rows={products.map((p) => {
            const { margin, marginPct } = calcMargin(p.buyPrice, p.sellPrice);
            return [
              p.name,
              p.unit,
              p.stock.toLocaleString("ar-EG"),
              fmt(p.buyPrice),
              fmt(p.sellPrice),
              <span style={{ color: margin >= 0 ? "#16a34a" : "#dc2626" }}>
                {fmt(margin)} ({marginPct}%)
              </span>,
              p.minStock,
              <div style={{ display: "flex", gap: 4 }}>
                <Btn
                  small
                  color="amber"
                  onClick={() =>
                    setModal(<EditProductModal product={p} products={products} setProducts={setProducts} showToast={showToast} onClose={() => setModal(null)} />)
                  }
                >
                  تعديل
                </Btn>
                <Btn small color="red" onClick={() => deleteProduct(p.id)}>
                  حذف
                </Btn>
              </div>,
            ];
          })}
        />
      </Card>
    </div>
  );
}
