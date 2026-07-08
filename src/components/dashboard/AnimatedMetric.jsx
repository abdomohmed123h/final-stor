import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export function AnimatedMetric({
  label,
  value,
  color,
  index = 0,
  decimals = 2,
  suffix = "ج.م"
}) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) =>
    v.toLocaleString("ar-EG", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  );

  useEffect(() => {
    spring.set(parseFloat(value) || 0);
  }, [value, spring]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white rounded-xl shadow p-4 min-w-[140px]"
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <motion.div className="text-lg font-bold" style={{ color }}>
        <motion.span>{display}</motion.span> {suffix}
      </motion.div>
    </motion.div>
  );
}
