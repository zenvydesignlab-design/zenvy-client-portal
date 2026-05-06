import { Download, Edit3, Eye, FileText, IndianRupee, Loader2, Receipt, Save, Trash2, X } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  deleteInvoice,
  deriveInvoiceStatus,
  formatCurrency,
  formatDate,
  formatShortDate,
  getInvoiceDownloadUrl,
  getInvoiceViewUrl,
  isGoogleDriveUrl,
  isValidInvoiceUrl,
  normalizeAssetLink,
  openAssetLink,
  saveInvoice,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';

const emptyForm = {
  id: '',
  invoice_number: '',
  title: '',
  amount: '',
  due_date: '',
  status: 'pending',
  pdf_url: '',
  notes: '',
};

const statusStyles = {
  paid: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
  pending: 'border-yellow-300/25 bg-yellow-300/10 text-yellow-200',
  overdue: 'border-ember/30 bg-ember/10 text-ember',
};

function InvoicePanel({ projectId, invoices = [], isAdmin = false, onChanged }) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [openingId, setOpeningId] = useState('');

  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [invoices],
  );
  const editing = Boolean(form.id);

  const resetForm = () => setForm(emptyForm);

  const submit = async () => {
    if (!form.invoice_number.trim()) {
      toast.error('Invoice number is required');
      return;
    }
    if (form.pdf_url && !isValidInvoiceUrl(form.pdf_url)) {
      toast.error('Use a valid Google Drive or Supabase PDF URL');
      return;
    }
    setSaving(true);
    try {
      await saveInvoice({ ...form, project_id: projectId }, user);
      toast.success(editing ? 'Invoice updated' : 'Invoice created');
      resetForm();
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const editInvoice = (invoice) => {
    setForm({
      id: invoice.id,
      invoice_number: invoice.invoice_number || invoice.title || '',
      title: invoice.title || '',
      amount: invoice.amount || '',
      due_date: invoice.due_date || '',
      status: deriveInvoiceStatus(invoice) === 'overdue' && invoice.status !== 'overdue' ? 'pending' : invoice.status || 'pending',
      pdf_url: invoice.pdf_url || '',
      notes: invoice.notes || '',
    });
  };

  const removeInvoice = async (invoice) => {
    if (!window.confirm(`Delete invoice ${invoice.invoice_number || invoice.title}?`)) return;
    setDeletingId(invoice.id);
    try {
      await deleteInvoice(invoice.id);
      toast.success('Invoice deleted');
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to delete invoice');
    } finally {
      setDeletingId('');
    }
  };

  const openInvoice = (invoice, mode) => {
    if (!invoice.pdf_url) return;
    setOpeningId(`${mode}-${invoice.id}`);
    openAssetLink(invoice.pdf_url, mode);
    window.setTimeout(() => setOpeningId(''), 450);
  };

  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Receipt className="h-5 w-5 text-aqua" />
          <div>
            <h3 className="text-xl font-black">Invoices</h3>
            <p className="mt-1 text-xs font-bold text-white/42">PDFs can live in Supabase Storage or Google Drive.</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-white/45">
          {sortedInvoices.length} total
        </span>
      </div>

      {isAdmin && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-aqua/70">{editing ? 'Edit invoice' : 'Create invoice'}</p>
            {editing && (
              <button type="button" onClick={resetForm} className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/55">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.invoice_number} onChange={(event) => setForm({ ...form, invoice_number: event.target.value })} placeholder="Invoice number" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
            <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} type="number" min="0" placeholder="Amount" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Short title" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
            <input value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} type="date" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white" />
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <input value={form.pdf_url} onChange={(event) => setForm({ ...form, pdf_url: event.target.value })} placeholder="Google Drive or Supabase PDF URL" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows="3" placeholder="Notes for the client" className="focus-ring resize-none rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35 sm:col-span-2" />
            <button type="button" disabled={saving} onClick={submit} className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-night transition hover:bg-aqua disabled:opacity-50 sm:col-span-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving invoice' : editing ? 'Update invoice' : 'Create invoice'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedInvoices.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/45">No invoices posted yet.</p>
        ) : sortedInvoices.map((invoice) => {
          const status = deriveInvoiceStatus(invoice);
          const hasPdf = Boolean(invoice.pdf_url);
          const validPdf = isValidInvoiceUrl(invoice.pdf_url);
          const canOpenPdf = hasPdf && validPdf;
          const link = normalizeAssetLink(invoice.pdf_url);
          const storageLabel = hasPdf
            ? validPdf
              ? (isGoogleDriveUrl(invoice.pdf_url) ? 'Google Drive PDF' : link.label === 'PDF link' ? 'Supabase/direct PDF' : 'External PDF link')
              : 'Invalid PDF link'
            : 'No PDF attached';
          return (
            <article key={invoice.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-aqua/25 hover:bg-white/[0.06]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-black">
                    <FileText className="h-4 w-4 shrink-0 text-white/45" />
                    {invoice.invoice_number || invoice.title}
                  </p>
                  {invoice.title && invoice.title !== invoice.invoice_number && <p className="mt-1 text-xs font-bold text-white/42">{invoice.title}</p>}
                  <p className="mt-3 flex items-center gap-2 text-lg font-black text-white">
                    <IndianRupee className="h-4 w-4 text-aqua" />
                    {formatCurrency(invoice.amount).replace('₹', '')}
                  </p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-[11px] font-black uppercase ${statusStyles[status]}`}>
                  {status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-night/35 p-3">
                  <p className="font-black uppercase tracking-[0.16em] text-white/32">Due date</p>
                  <p className="mt-1 font-bold text-white/68">{formatShortDate(invoice.due_date)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-night/35 p-3">
                  <p className="font-black uppercase tracking-[0.16em] text-white/32">Created</p>
                  <p className="mt-1 font-bold text-white/68">{formatDate(invoice.created_at)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-night/35 p-3">
                  <p className="font-black uppercase tracking-[0.16em] text-white/32">File</p>
                  <p className="mt-1 truncate font-bold text-white/68">{storageLabel}</p>
                </div>
              </div>

              {invoice.notes && <p className="mt-3 rounded-xl border border-white/10 bg-night/30 p-3 text-xs leading-5 text-white/55">{invoice.notes}</p>}
              {hasPdf && !validPdf && (
                <p className="mt-3 rounded-xl border border-ember/25 bg-ember/10 p-3 text-xs font-bold leading-5 text-ember">
                  This invoice link is invalid. Ask the admin to attach a valid Google Drive or Supabase PDF URL.
                </p>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <a href={canOpenPdf ? getInvoiceViewUrl(invoice.pdf_url) : undefined} target="_blank" rel="noreferrer" aria-disabled={!canOpenPdf} onClick={(event) => { if (!canOpenPdf) event.preventDefault(); }} className={`focus-ring flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black transition hover:border-aqua/30 hover:text-white ${canOpenPdf ? 'text-white/70' : 'pointer-events-none cursor-not-allowed text-white/25 opacity-35'}`}>
                  {openingId === `view-${invoice.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  View Invoice
                </a>
                <button type="button" disabled={!canOpenPdf || openingId === `download-${invoice.id}`} onClick={() => openInvoice(invoice, 'download')} data-download-url={canOpenPdf ? getInvoiceDownloadUrl(invoice.pdf_url) : ''} className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-night transition hover:bg-aqua disabled:cursor-not-allowed disabled:opacity-35">
                  {openingId === `download-${invoice.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Invoice
                </button>
                {isAdmin && (
                  <button type="button" onClick={() => editInvoice(invoice)} className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/70 transition hover:border-violet/30 hover:text-white">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button type="button" disabled={deletingId === invoice.id} onClick={() => removeInvoice(invoice)} className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-ember/25 bg-ember/10 px-3 py-2 text-xs font-black text-ember disabled:opacity-50">
                    {deletingId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

export default memo(InvoicePanel);
