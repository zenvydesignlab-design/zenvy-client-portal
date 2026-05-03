import { Sparkles } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', text = 'New activity will appear here soon.' }) {
  return (
    <div className="glass grid min-h-64 place-items-center rounded-3xl p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-aqua/20 bg-aqua/10 text-aqua">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-black">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/48">{text}</p>
      </div>
    </div>
  );
}
