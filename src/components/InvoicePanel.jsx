import { BlobProvider, PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Edit3, Eye, FileText, Loader2, Plus, Receipt, Trash2 } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  deleteInvoice,
  deriveInvoiceStatus,
  formatCurrency,
  formatShortDate,
  getInvoiceDownloadUrl,
  getInvoiceViewUrl,
  isValidInvoiceUrl,
  openAssetLink,
  saveInvoice,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import InvoiceGenerator from './InvoiceGenerator';
import InvoicePDF from './InvoicePDF';

const statusStyles = {
  paid: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  pending: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
  overdue: 'border-red-500/20 bg-red-500/5 text-red-400',
  void: 'border-slate-500/20 bg-slate-500/5 text-slate-400',
};

function GeneratedPdfViewButton({ invoice }) {
  return (
    <BlobProvider document={<InvoicePDF invoice={invoice} />}>
      {({ url, loading }) => (
        <a
          href={url || undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={loading || !url}
          onClick={(event) => {
            if (loading || !url) event.preventDefault();
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-aqua ${
            loading || !url ? 'pointer-events-none opacity-50' : ''
          }`}
          title="View Invoice"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        </a>
      )}
    </BlobProvider>
  );
}

function InvoicePdfActions({ invoice }) {
  const [openingMode, setOpeningMode] = useState('');
  const hasLinkedPdf = Boolean(invoice.pdf_url);
  const validLinkedPdf = isValidInvoiceUrl(invoice.pdf_url);
  const canOpenLinkedPdf = hasLinkedPdf && validLinkedPdf;

  const openLinkedInvoice = (mode) => {
    if (!canOpenLinkedPdf) return;
    setOpeningMode(mode);
    openAssetLink(invoice.pdf_url, mode);
    window.setTimeout(() => setOpeningMode(''), 450);
  };

  if (canOpenLinkedPdf) {
    return (
      <>
        <a
          href={getInvoiceViewUrl(invoice.pdf_url)}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-aqua"
          title="View Invoice"
        >
          {openingMode === 'view' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        </a>
        <button
          type="button"
          onClick={() => openLinkedInvoice('download')}
          disabled={openingMode === 'download'}
          data-download-url={getInvoiceDownloadUrl(invoice.pdf_url)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-aqua disabled:opacity-50"
          title="Download Invoice"
        >
          {openingMode === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </button>
      </>
    );
  }

  return (
    <>
      <GeneratedPdfViewButton invoice={invoice} />
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} />}
        fileName={`${invoice.invoice_number || 'invoice'}.pdf`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-aqua"
        title={hasLinkedPdf && !validLinkedPdf ? 'Download generated PDF because attached link is invalid' : 'Download Invoice'}
      >
        {({ loading }) => (loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />)}
      </PDFDownloadLink>
    </>
  );
}

function InvoicePanel({ project, invoices = [], isAdmin = false, onChanged }) {
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [invoices],
  );

  const handleSave = async (payload) => {
    try {
      await saveInvoice({ ...payload, project_id: project.id }, user);
      toast.success(payload.id ? 'Invoice updated' : 'Invoice created');
      setShowGenerator(false);
      setEditingInvoice(null);
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to save invoice');
    }
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

  if (showGenerator || editingInvoice) {
    return (
      <section className="glass rounded-3xl p-5 sm:p-8">
        <InvoiceGenerator
          project={project}
          invoice={editingInvoice}
          onSave={handleSave}
          onCancel={() => {
            setShowGenerator(false);
            setEditingInvoice(null);
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-aqua" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Financial Records</p>
          </div>
          <h3 className="mt-1 text-2xl font-bold text-white">Invoices</h3>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowGenerator(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-night transition-colors hover:bg-aqua sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {sortedInvoices.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center rounded-2xl py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-500">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-400">No invoices generated yet.</p>
          </div>
        ) : (
          sortedInvoices.map((invoice) => {
            const status = deriveInvoiceStatus(invoice);

            return (
              <article
                key={invoice.id}
                className="group glass flex flex-col gap-5 rounded-2xl p-5 transition-all hover:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-aqua">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-white">{invoice.invoice_number || invoice.title}</p>
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles[status]}`}>
                        {status}
                      </span>
                    </div>
                    {invoice.title && invoice.title !== invoice.invoice_number && (
                      <p className="mt-1 truncate text-xs text-slate-500">{invoice.title}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                  <div className="sm:text-right">
                    <p className="text-lg font-black text-white">{formatCurrency(invoice.total ?? invoice.amount, invoice.currency)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Due {invoice.due_date ? formatShortDate(invoice.due_date) : 'N/A'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 xs:flex xs:items-center">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingInvoice(invoice)}
                          className="flex h-9 w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-white xs:w-9"
                          title="Edit Invoice"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeInvoice(invoice)}
                          disabled={deletingId === invoice.id}
                          className="flex h-9 w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-red-400 disabled:opacity-50 xs:w-9"
                          title="Delete Invoice"
                        >
                          {deletingId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </>
                    )}
                    <InvoicePdfActions invoice={invoice} />
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default memo(InvoicePanel);
