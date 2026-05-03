import { motion } from 'framer-motion';
import { memo } from 'react';

function ProgressBar({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/52">
        <span>Progress</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-aqua via-violet to-ember"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default memo(ProgressBar);
