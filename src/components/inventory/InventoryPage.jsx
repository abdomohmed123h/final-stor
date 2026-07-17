import { Card, Table, Badge, Btn } from "../ui";
import { EditInventoryModal } from "./EditInventoryModal";
import { fmt } from "../../utils/format";

export function InventoryPage({ products, setProducts, showToast, setModal }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
          📦 المخزون
        </h2>
      </div>
      <Card>
        <Table
          cols={[
            "الصنف",
            "المخزون",
            "الوحدة",
            "سعر الشراء",
            "سعر البيع",
            "الحد الأدنى",
            "الحالة",
            ""
          ]}
          rows={products.map((p) => [
            p.name,
            p.stock.toLocaleString("ar-EG"),
            p.unit,
            fmt(p.buyPrice),
            fmt(p.sellPrice),
            p.minStock,
            p.stock <= p.minStock ? (
              <Badge color="red">منخفض</Badge>
            ) : (
              <Badge color="green">جيد</Badge>
            ),
            <Btn
              small
              color="amber"
              onClick={() =>
                setModal(
                  <EditInventoryModal
                    product={p}
                    products={products}
                    setProducts={setProducts}
                    showToast={showToast}
                    onClose={() => setModal(null)}
                  />
                )
              }
            >
              تعديل
            </Btn>
          ])}
        />
      </Card>
    </div>
  );
}
