import { Download, FileCheck2, FileText, Link as LinkIcon, Loader2, Save, Trash2, UploadCloud } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { deleteContract, formatDate, isValidExternalUrl, normalizeAssetLink, openAssetLink, saveContract, uploadContractPdf } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const emptyForm = { title: '', contract_url: '' };

function ContractPanel({ projectId, contracts = [], isAdmin = false, onChanged }) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const sortedContracts = useMemo(() => [...contracts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), [contracts]);

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error('Contract title is required');
      return;
    }
    if (!form.contract_url.trim() || !isValidExternalUrl(form.contract_url)) {
      toast.error('Attach a valid Google Drive or PDF URL');
      return;
    }
    setSaving(true);
    try {
      await saveContract({ ...form, project_id: projectId }, user);
      toast.success('Contract saved');
      setForm(emptyForm);
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to save contract');
    } finally {
      setSaving(false);
    }
  };

  const uploadPdf = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadContractPdf({ projectId, file, userId: user.id, onProgress: setProgress });
      setForm((current) => ({ ...current, title: current.title || file.name.replace(/\.pdf$/i, ''), contract_url: publicUrl }));
      toast.success('Contract PDF uploaded');
    } catch (error) {
      toast.error(error.message || 'Unable to upload contract');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const remove = async (contract) => {
    if (!window.confirm(`Delete contract ${contract.title}?`)) return;
    setDeletingId(contract.id);
    try {
      await deleteContract(contract.id);
      toast.success('Contract deleted');
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to delete contract');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-5 w-5 text-violet" />
          <div>
            <h3 className="text-xl font-black">Contracts</h3>
            <p className="mt-1 text-xs font-bold text-white/42">Signed PDFs and Drive agreements stay read-only for clients.</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-white/45">{sortedContracts.length} total</span>
      </div>

      {isAdmin && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-violet/75">Add contract</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contract title" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
            <input value={form.contract_url} onChange={(event) => setForm({ ...form, contract_url: event.target.value })} placeholder="Google Drive or Supabase PDF URL" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
            <label className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet/25 bg-violet/[0.06] px-3 py-2 text-sm font-black text-white/75 transition hover:border-violet/45">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {uploading ? `Uploading ${progress}%` : 'Upload contract PDF'}
              <input type="file" accept="application/pdf" className="hidden" onChange={(event) => uploadPdf(event.target.files?.[0])} />
            </label>
            <button type="button" disabled={saving || uploading} onClick={submit} className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-night transition hover:bg-aqua disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save contract
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedContracts.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/45">No contracts attached yet.</p>
        ) : sortedContracts.map((contract) => {
          const link = normalizeAssetLink(contract.contract_url);
          return (
            <article key={contract.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-violet/30 hover:bg-white/[0.06]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-black">
                    <FileText className="h-4 w-4 shrink-0 text-white/45" />
                    {contract.title}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs font-bold text-white/42">
                    <LinkIcon className="h-3.5 w-3.5" />
                    {link.label}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-night/35 px-3 py-1 text-[11px] font-black text-white/45">{formatDate(contract.created_at)}</span>
              </div>

              {!link.isValid && <p className="mt-3 rounded-xl border border-ember/25 bg-ember/10 p-3 text-xs font-bold text-ember">This contract link is invalid. Ask the admin to replace it.</p>}

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <button type="button" disabled={!link.isValid} onClick={() => openAssetLink(contract.contract_url, 'view')} className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/70 transition hover:border-violet/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">
                  <FileCheck2 className="h-4 w-4" />
                  View Contract
                </button>
                <button type="button" disabled={!link.isValid} onClick={() => openAssetLink(contract.contract_url, 'download')} className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-night transition hover:bg-aqua disabled:cursor-not-allowed disabled:opacity-35">
                  <Download className="h-4 w-4" />
                  Download Contract
                </button>
                {isAdmin && (
                  <button type="button" disabled={deletingId === contract.id} onClick={() => remove(contract)} className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-ember/25 bg-ember/10 px-3 py-2 text-xs font-black text-ember disabled:opacity-50">
                    {deletingId === contract.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default memo(ContractPanel);
