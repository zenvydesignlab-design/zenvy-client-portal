import { CheckCircle2, Clock3, FileUp, MessageSquare, Sparkles } from 'lucide-react';
import { formatDate } from '../services/api';

const icons = {
  upload: FileUp,
  message: MessageSquare,
  approval: CheckCircle2,
  status: Sparkles,
};

export default function ActivityTimeline({ items = [], compact = false }) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {items.map((item) => {
        const Icon = icons[item.kind] || Clock3;
        return (
          <div key={item.id || item.title} className="grid grid-cols-[1.75rem_1fr] gap-3">
            <span className="mt-1 grid h-7 w-7 place-items-center rounded-full border border-aqua/20 bg-aqua/10">
              <Icon className="h-3.5 w-3.5 text-aqua" />
            </span>
            <span className="min-w-0 border-b border-white/8 pb-3 last:border-0">
              <span className="block text-sm font-black leading-6">{item.title}</span>
              {item.detail && <span className="block text-xs leading-5 text-white/42">{item.detail}</span>}
              <span className="mt-1 block text-xs font-bold text-white/35">{formatDate(item.date)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
