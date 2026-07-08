// components/ui/SearchableSelect.jsx
import { useState, useRef, useEffect } from "react";

// Normalizes Arabic text for forgiving search matching:
// - unifies alef forms (أ إ آ ا) → ا
// - unifies ta marbuta / ha (ة) → ه
// - unifies alef maksura / ya (ى) → ي
// - strips diacritics (tashkeel) and tatweel
// - lowercases for any Latin characters mixed in
function normalizeArabic(str) {
  return (str || "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // tashkeel + tatweel
    .toLowerCase()
    .trim();
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options, // [{ id, name, ...anything }]
  placeholder = "ابحث...",
  emptyLabel = "لا توجد نتائج",
  getSearchText = (o) => o.name,
  renderOption = (o) => o.name,
  renderSelected = (o) => o.name
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = normalizeArabic(query);
  const filtered = options.filter((o) =>
    normalizeArabic(getSearchText(o)).includes(normalizedQuery)
  );

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
        </label>
      )}

      <div
        onClick={() => setOpen(true)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer flex items-center justify-between"
      >
        {open ? (
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full outline-none bg-transparent"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={selected ? "text-gray-900" : "text-gray-400"}>
            {selected ? renderSelected(selected) : placeholder}
          </span>
        )}
        <span className="text-gray-400 text-xs">▾</span>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400 text-center">
              {emptyLabel}
            </div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                  o.id === value ? "bg-green-50 text-green-700 font-medium" : ""
                }`}
              >
                {renderOption(o)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
