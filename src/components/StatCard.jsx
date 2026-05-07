import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, tone = 'aqua' }) {
  const toneMap = {
    ember: 'text-ember bg-ember/5 border-ember/10 shadow-ember/5',
    violet: 'text-violet bg-violet/5 border-violet/10 shadow-violet/5',
    aqua: 'text-aqua bg-aqua/5 border-aqua/10 shadow-aqua/5',
  };
  
  const toneClass = toneMap[tone] || toneMap.aqua;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${toneClass}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      </div>
    </motion.div>
  );
}
