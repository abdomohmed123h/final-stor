export function EmployeeMultiSelect({
  employees,
  selectedIds,
  onChange,
  loadingFee,
  onLoadingFeeChange
}) {
  const activeEmployees = employees.filter((e) => e.status !== "inactive");

  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-500 mb-1">
        عمال التحميل / التفريغ (اختياري — يمكن اختيار أكثر من عامل)
      </label>
      <div className="flex gap-2 flex-wrap mb-2">
        {activeEmployees.length === 0 ? (
          <span className="text-xs text-gray-400">لا يوجد عمال مسجلين</span>
        ) : (
          activeEmployees.map((e) => {
            const active = selectedIds.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => toggle(e.id)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                {e.name}
              </button>
            );
          })
        )}
      </div>

      {selectedIds.length > 0 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            أجرة التحميل/التفريغ (ج.م)
          </label>
          <input
            type="number"
            value={loadingFee}
            onChange={(e) => onLoadingFeeChange(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
          />
          <div className="text-[11px] text-gray-400 mt-1">
            ⚠️ هذا المبلغ لا يُضاف إلى فاتورة العميل — يُسجَّل تلقائياً كمصروف
            على المحل.
          </div>
        </div>
      )}
    </div>
  );
}
