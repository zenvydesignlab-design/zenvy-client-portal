import { BlobProvider, PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Eye, Plus, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import ContractPDF from './ContractPDF';

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

export default function ContractGenerator({ project, contract: initialContract, onSave, onCancel }) {
  const [contract, setContract] = useState(() => ({
    title: `${project.name} - Project Agreement`,
    deliverables: [''],
    timeline: '',
    payment_terms: '',
    revisions: 'Two revision rounds are included unless otherwise agreed in writing.',
    notes: '',
    status: 'draft',
    pdf_url: '',
    signed: false,
    signed_at: null,
    client_name: '',
    client_email: '',
    ...initialContract,
    project_scope: initialContract?.project_scope || initialContract?.scope || '',
    ownership_clause: initialContract?.ownership_clause || initialContract?.ownership_terms || 'Final approved deliverables transfer to the client after full payment. Zenvy Studio retains the right to display work in portfolio contexts.',
    cancellation_clause: initialContract?.cancellation_clause || initialContract?.cancellation_terms || 'Either party may cancel with written notice. Completed work and approved milestones remain billable.',
  }));
  const [previewOpen, setPreviewOpen] = useState(false);

  const deliverables = useMemo(
    () => (contract.deliverables?.length ? contract.deliverables : ['']),
    [contract.deliverables],
  );

  const addDeliverable = () => {
    setContract({ ...contract, deliverables: [...deliverables, ''] });
  };

  const removeDeliverable = (index) => {
    const items = [...deliverables];
    items.splice(index, 1);
    setContract({ ...contract, deliverables: items.length ? items : [''] });
  };

  const updateDeliverable = (index, value) => {
    const items = [...deliverables];
    items[index] = value;
    setContract({ ...contract, deliverables: items });
  };

  const handleSave = async () => {
    if (!contract.title?.trim()) return toast.error('Contract title is required');
    try {
      await onSave({ ...contract, deliverables });
    } catch (error) {
      toast.error(error.message || 'Failed to save contract');
    }
  };

  return (
    <div className="animate-slide-up -m-5 flex max-h-[calc(100vh-7rem)] flex-col sm:-m-8">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-5 sm:px-8">
        <div>
          <p className="section-label">Legal Agreement</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">
            {initialContract ? 'Edit Contract' : 'Create Contract'}
          </h3>
        </div>
        <button type="button" onClick={onCancel} className="icon-button" title="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-8">
        <section className="space-y-4">
          {sectionTitle('Basics', 'Client identity, status, and the attached contract PDF.')}
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <label className={labelClass}>Contract Title</label>
              <input
                value={contract.title}
                onChange={(e) => setContract({ ...contract, title: e.target.value })}
                className={fieldClass}
                placeholder="Project Branding Agreement"
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={contract.status || 'draft'}
                onChange={(e) => setContract({ ...contract, status: e.target.value })}
                className={fieldClass}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Client Name</label>
              <input value={contract.client_name || ''} onChange={(e) => setContract({ ...contract, client_name: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Client Email</label>
              <input type="email" value={contract.client_email || ''} onChange={(e) => setContract({ ...contract, client_email: e.target.value })} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Existing PDF URL</label>
            <input
              value={contract.pdf_url || ''}
              onChange={(e) => setContract({ ...contract, pdf_url: e.target.value })}
              className={fieldClass}
              placeholder="Optional Google Drive, Supabase, or direct PDF link"
            />
          </div>
        </section>

        <section className="space-y-4">
          {sectionTitle('Work Scope', 'Define what is included and the concrete deliverables the client will receive.')}
          <div>
            <label className={labelClass}>Project Scope</label>
            <textarea
              value={contract.project_scope || ''}
              onChange={(e) => setContract({ ...contract, project_scope: e.target.value })}
              rows={4}
              className={`${fieldClass} resize-none`}
              placeholder="Define the work to be done..."
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className={labelClass}>Deliverables</label>
              <button type="button" onClick={addDeliverable} className="inline-flex items-center gap-2 text-[11px] font-bold text-aqua transition-colors hover:text-white">
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {deliverables.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_2.25rem] gap-2">
                  <input
                    value={item}
                    onChange={(e) => updateDeliverable(index, e.target.value)}
                    className={fieldClass}
                    placeholder="Brand Style Guide PDF"
                  />
                  <button type="button" onClick={() => removeDeliverable(index)} className="icon-button mt-1.5 text-slate-500 hover:text-red-400" title="Remove deliverable">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {sectionTitle('Commercial Terms', 'Timeline, payment, revision, ownership, and cancellation language.')}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Timeline</label>
              <textarea value={contract.timeline || ''} onChange={(e) => setContract({ ...contract, timeline: e.target.value })} rows={3} className={`${fieldClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Payment Terms</label>
              <textarea value={contract.payment_terms || ''} onChange={(e) => setContract({ ...contract, payment_terms: e.target.value })} rows={3} className={`${fieldClass} resize-none`} />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Revisions</label>
              <textarea value={contract.revisions || ''} onChange={(e) => setContract({ ...contract, revisions: e.target.value })} rows={4} className={`${fieldClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Ownership Clause</label>
              <textarea value={contract.ownership_clause || ''} onChange={(e) => setContract({ ...contract, ownership_clause: e.target.value })} rows={4} className={`${fieldClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Cancellation Clause</label>
              <textarea value={contract.cancellation_clause || ''} onChange={(e) => setContract({ ...contract, cancellation_clause: e.target.value })} rows={4} className={`${fieldClass} resize-none`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Internal Notes</label>
            <textarea value={contract.notes || ''} onChange={(e) => setContract({ ...contract, notes: e.target.value })} rows={2} className={`${fieldClass} resize-none`} />
          </div>
        </section>

        {previewOpen && (
          <BlobProvider document={<ContractPDF contract={contract} project={project} />}>
            {({ url, loading, error }) => (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                  <p className="section-label">Contract PDF Preview</p>
                  {loading && <span className="section-label text-aqua">Preparing</span>}
                  {error && <span className="section-label text-red-400">Preview failed</span>}
                </div>
                {url && <iframe src={url} title="Contract preview" className="h-[32rem] w-full bg-white" />}
              </div>
            )}
          </BlobProvider>
        )}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-white/5 bg-night/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="text-xs text-slate-500">
          {contract.signed ? 'Signed contract' : 'Draft contract'} for {contract.client_name || 'client'}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setPreviewOpen(!previewOpen)} className="btn-ghost">
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <PDFDownloadLink document={<ContractPDF contract={contract} project={project} />} fileName={`${contract.title || 'contract'}.pdf`} className="btn-ghost">
            {({ loading }) => (
              <>
                <Download className="h-4 w-4" />
                {loading ? 'Preparing' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
          <button type="button" onClick={handleSave} className="btn-primary">
            <Save className="h-4 w-4" />
            Save Contract
          </button>
        </div>
      </div>
    </div>
  );
}
