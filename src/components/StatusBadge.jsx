const styles = {
  Discovery: 'border-ember/25 bg-ember/10 text-ember',
  Wireframing: 'border-aqua/25 bg-aqua/10 text-aqua',
  Design: 'border-violet/25 bg-violet/10 text-violet',
  Development: 'border-aqua/25 bg-aqua/10 text-aqua',
  Review: 'border-violet/25 bg-violet/10 text-violet',
  Delivered: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
  Complete: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${styles[status] || 'border-white/10 bg-white/5 text-white/50'}`}>
      {status || 'Discovery'}
    </span>
  );
}
