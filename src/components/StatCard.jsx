import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, tone = 'aqua' }) {
  const toneClass = tone === 'ember' ? 'text-ember bg-ember/10 border-ember/20' : tone === 'violet' ? 'text-violet bg-violet/10 border-violet/20' : 'text-aqua bg-aqua/10 border-aqua/20';
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5">
      <div className={`mb-6 grid h-12 w-12 place-items-center rounded-2xl border ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-white/48">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight">{value}</p>
    </motion.div>
  );
}
