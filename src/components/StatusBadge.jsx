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
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-black ${styles[status] || 'border-white/10 bg-white/10 text-white/70'}`}>
      {status || 'Discovery'}
    </span>
  );
}
