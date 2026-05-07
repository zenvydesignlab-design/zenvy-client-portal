import { BlobProvider, PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Eye, Plus, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import InvoicePDF from './InvoicePDF';

const emptyLineItem = { description: '', quantity: 1, price: 0 };
const fieldClass = 'field mt-1.5 px-3 py-2.5 text-sm';
const labelClass = 'section-label';

function sectionTitle(title, detail) {
  return (
    <div>
      <p className="text-sm font-bold text-white">{title}</p>
      {detail && <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>}
    </div>
  );
}

export default function InvoiceGenerator({ project, invoice: initialInvoice, onSave, onCancel }) {
  const [invoice, setInvoice] = useState(() => ({
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    title: project.name,
    description: '',
    amount: 0,
    status: 'pending',
    currency: 'INR',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    line_items: [{ ...emptyLineItem }],
    tax_rate: 0,
    payment_terms: 'Due within 7 days of invoice date.',
    pdf_url: '',
    notes: 'Thank you for your business!',
    client_name: '',
    client_email: '',
    ...initialInvoice,
  }));
  const [previewOpen, setPreviewOpen] = useState(false);

  const lineItems = useMemo(
    () => (invoice.line_items?.length ? invoice.line_items : [{ ...emptyLineItem }]),
    [invoice.line_items],
  );
  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
  const tax = subtotal * (Number(invoice.tax_rate || 0) / 100);
  const total = subtotal + tax;
  const previewInvoice = { ...invoice, line_items: lineItems, subtotal, tax, total, amount: total };
  const money = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: invoice.currency || 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

  const addLineItem = () => {
    setInvoice({ ...invoice, line_items: [...lineItems, { ...emptyLineItem }] });
  };

  const removeLineItem = (index) => {
    const items = [...lineItems];
    items.splice(index, 1);
    setInvoice({ ...invoice, line_items: items.length ? items : [{ ...emptyLineItem }] });
  };

  const updateLineItem = (index, field, value) => {
    const items = [...lineItems];
    items[index] = { ...items[index], [field]: field === 'description' ? value : Number(value) };
    setInvoice({ ...invoice, line_items: items });
  };

  const handleSave = async () => {
    if (!invoice.invoice_number?.trim()) return toast.error('Invoice number is required');
    if (!lineItems.some((item) => item.description?.trim())) return toast.error('Add at least one line item');
    try {
      await onSave({ ...invoice, line_items: lineItems, subtotal, tax, total, amount: total });
    } catch (error) {
      toast.error(error.message || 'Failed to save invoice');
    }
  };

  return (
    <div className="animate-slide-up -m-5 flex max-h-[calc(100vh-7rem)] flex-col sm:-m-8">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-5 sm:px-8">
        <div>
          <p className="section-label">Billing Document</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">
            {initialInvoice ? 'Edit Invoice' : 'Create Invoice'}
          </h3>
        </div>
        <button type="button" onClick={onCancel} className="icon-button" title="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-8">
        <section className="space-y-4">
          {sectionTitle('Invoice Details', 'Reference, due date, status, currency, and client information.')}
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className={labelClass}>Invoice Number</label>
              <input value={invoice.invoice_number} onChange={(e) => setInvoice({ ...invoice, invoice_number: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input type="date" value={invoice.due_date || ''} onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={invoice.status || 'pending'} onChange={(e) => setInvoice({ ...invoice, status: e.target.value })} className={fieldClass}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="void">Void</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Project / Title</label>
              <input value={invoice.title || ''} onChange={(e) => setInvoice({ ...invoice, title: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select value={invoice.currency || 'INR'} onChange={(e) => setInvoice({ ...invoice, currency: e.target.value })} className={fieldClass}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Client Name</label>
              <input value={invoice.client_name || ''} onChange={(e) => setInvoice({ ...invoice, client_name: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Client Email</label>
              <input type="email" value={invoice.client_email || ''} onChange={(e) => setInvoice({ ...invoice, client_email: e.target.value })} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input value={invoice.description || ''} onChange={(e) => setInvoice({ ...invoice, description: e.target.value })} className={fieldClass} placeholder="Short summary of the billed work" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            {sectionTitle('Line Items', 'Use clear item names so the generated PDF reads cleanly.')}
            <button type="button" onClick={addLineItem} className="inline-flex items-center gap-2 text-[11px] font-bold text-aqua transition-colors hover:text-white">
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_5rem_8rem_2.25rem]">
                <input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} className={fieldClass} />
                <input type="number" min="0" placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', e.target.value)} className={`${fieldClass} text-center`} />
                <input type="number" min="0" placeholder="Price" value={item.price} onChange={(e) => updateLineItem(index, 'price', e.target.value)} className={`${fieldClass} text-right`} />
                <button type="button" onClick={() => removeLineItem(index)} className="icon-button mt-1.5 text-slate-500 hover:text-red-400" title="Remove line item">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-4">
            {sectionTitle('Terms', 'Payment language, notes, tax, and optional externally stored PDF.')}
            <div>
              <label className={labelClass}>Existing PDF URL</label>
              <input value={invoice.pdf_url || ''} onChange={(e) => setInvoice({ ...invoice, pdf_url: e.target.value })} placeholder="Optional Google Drive, Supabase, or direct PDF link" className={fieldClass} />
            </div>
            <div className="grid gap-4 md:grid-cols-[9rem_1fr]">
              <div>
                <label className={labelClass}>Tax Rate (%)</label>
                <input type="number" min="0" value={invoice.tax_rate || 0} onChange={(e) => setInvoice({ ...invoice, tax_rate: Number(e.target.value) })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Payment Terms</label>
                <textarea value={invoice.payment_terms || ''} onChange={(e) => setInvoice({ ...invoice, payment_terms: e.target.value })} rows={2} className={`${fieldClass} resize-none`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={invoice.notes || ''} onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })} rows={2} className={`${fieldClass} resize-none`} />
            </div>
          </div>

          <div className="surface h-fit rounded-2xl p-4">
            <p className="section-label">Summary</p>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span className="font-semibold text-white">{money(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-slate-400"><span>Tax</span><span className="font-semibold text-white">{money(tax)}</span></div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between text-base font-black text-white"><span>Total</span><span className="text-aqua">{money(total)}</span></div>
              </div>
            </div>
          </div>
        </section>

        {previewOpen && (
          <BlobProvider document={<InvoicePDF invoice={previewInvoice} />}>
            {({ url, loading, error }) => (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                  <p className="section-label">Invoice PDF Preview</p>
                  {loading && <span className="section-label text-aqua">Preparing</span>}
                  {error && <span className="section-label text-red-400">Preview failed</span>}
                </div>
                {url && <iframe src={url} title="Invoice preview" className="h-[32rem] w-full bg-white" />}
              </div>
            )}
          </BlobProvider>
        )}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-white/5 bg-night/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="text-xs text-slate-500">
          Total due: <span className="font-bold text-white">{money(total)}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setPreviewOpen(!previewOpen)} className="btn-ghost">
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <PDFDownloadLink document={<InvoicePDF invoice={previewInvoice} />} fileName={`${invoice.invoice_number || 'invoice'}.pdf`} className="btn-ghost">
            {({ loading }) => (
              <>
                <Download className="h-4 w-4" />
                {loading ? 'Preparing' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
          <button type="button" onClick={handleSave} className="btn-primary">
            <Save className="h-4 w-4" />
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
