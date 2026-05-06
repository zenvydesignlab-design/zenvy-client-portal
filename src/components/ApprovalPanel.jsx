import { CheckCircle2, MessageSquareWarning, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { respondToApproval, saveApproval } from '../services/api';

const styles = {
  pending: 'border-ember/25 bg-ember/10 text-ember',
  approved: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
  revision_requested: 'border-violet/25 bg-violet/10 text-violet',
};

export default function ApprovalPanel({ projectId, approvals = [], isAdmin = false, onChanged }) {
  const [form, setForm] = useState({ title: '', description: '', asset_url: '' });
  const [feedback, setFeedback] = useState({});

  const submit = async () => {
    if (!form.title.trim()) return;
    try {
      await saveApproval({ ...form, project_id: projectId, status: 'pending' });
      toast.success('Approval request created');
      setForm({ title: '', description: '', asset_url: '' });
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to create approval');
    }
  };

  const respond = async (approvalId, status) => {
    try {
      await respondToApproval({ approvalId, status, feedback: feedback[approvalId] || '' });
      toast.success(status === 'approved' ? 'Approved' : 'Revision requested');
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to save response');
    }
  };

  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-aqua" />
        <h3 className="text-xl font-black">Approvals</h3>
      </div>
      {isAdmin && (
        <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Approval item title" className="focus-ring w-full rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white" />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" placeholder="What should the client review?" className="focus-ring w-full resize-none rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
          <input value={form.asset_url} onChange={(event) => setForm({ ...form, asset_url: event.target.value })} placeholder="Design/file preview link" className="focus-ring w-full rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
          <button type="button" onClick={submit} className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-night transition hover:bg-aqua">
            <Save className="h-4 w-4" />
            Request approval
          </button>
        </div>
      )}

      <div className="space-y-3">
        {approvals.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/45">No approvals waiting.</p>
        ) : approvals.map((approval) => (
          <article key={approval.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black">{approval.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/45">{approval.description}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase ${styles[approval.status] || styles.pending}`}>{approval.status}</span>
            </div>
            {approval.asset_url && <a href={approval.asset_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-black text-aqua">Open preview</a>}
            {!isAdmin && approval.status === 'pending' && (
              <div className="mt-4 space-y-3">
                <textarea value={feedback[approval.id] || ''} onChange={(event) => setFeedback({ ...feedback, [approval.id]: event.target.value })} rows="3" placeholder="Feedback or revision notes" className="focus-ring w-full resize-none rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => respond(approval.id, 'approved')} className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-night transition hover:bg-aqua">
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button type="button" onClick={() => respond(approval.id, 'revision_requested')} className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet/25 bg-violet/10 px-3 py-2 text-sm font-black text-violet">
                    <MessageSquareWarning className="h-4 w-4" />
                    Request revision
                  </button>
                </div>
              </div>
            )}
            {approval.feedback && <p className="mt-3 rounded-xl border border-violet/20 bg-violet/10 p-3 text-xs leading-5 text-white/68">{approval.feedback}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
