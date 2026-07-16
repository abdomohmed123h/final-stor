// components/ui/HoverMetricCard.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AnimatedMetric } from "../dashboard/AnimatedMetric";

// Wraps AnimatedMetric with a hover-revealed detail popover showing
// extra breakdown info (e.g. which product/customer, not just the number).
export function HoverMetricCard({
  label,
  value,
  color,
  decimals,
  suffix,
  details
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatedMetric
        label={label}
        value={value}
        color={color}
        decimals={decimals}
        suffix={suffix}
      />

      <AnimatePresence>
        {hovered && details && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[200px]"
          >
            <div className="text-xs font-bold text-slate-700 mb-2 border-b border-gray-100 pb-1.5">
              {details.title}
            </div>
            <div className="space-y-1.5">
              {details.rows.map((row, i) => (
                <div key={i} className="flex justify-between text-xs gap-3">
                  <span className="text-gray-500">{row.label}</span>
                  <span
                    className="font-semibold"
                    style={{ color: row.color || "#374151" }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
