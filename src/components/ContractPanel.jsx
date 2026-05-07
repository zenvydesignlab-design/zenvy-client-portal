import { CheckCircle2, Download, Edit3, Eye, FileSignature, FileText, Loader2, Plus, ScrollText, ShieldCheck, Trash2 } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  deleteContract,
  formatDate,
  getInvoiceDownloadUrl,
  getInvoiceViewUrl,
  normalizeAssetLink,
  openAssetLink,
  saveContract,
  signContract,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ContractGenerator from './ContractGenerator';
import ContractPDF from './ContractPDF';

function ContractPanel({ project, contracts = [], isAdmin = false, onChanged }) {
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [signingId, setSigningId] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState(user?.email || '');
  const [accepted, setAccepted] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  const sortedContracts = useMemo(
    () => [...contracts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [contracts],
  );

  const handleSave = async (payload) => {
    try {
      await saveContract({ ...payload, project_id: project.id }, user);
      toast.success(payload.id ? 'Contract updated' : 'Contract created');
      setShowGenerator(false);
      setEditingContract(null);
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to save contract');
    }
  };

  const removeContract = async (contract) => {
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

  const startSigning = (contract) => {
    setSigningId(contract.id);
    setSignerName(contract.client_name || contract.signed_by || '');
    setSignerEmail(contract.client_email || contract.signed_email || user?.email || '');
    setAccepted(false);
  };

  const submitSignature = async (contract) => {
    if (!accepted) return toast.error('Confirm that you agree to the contract terms');
    if (!signerName.trim()) return toast.error('Enter your legal full name');
    if (!signerEmail.trim()) return toast.error('Enter your signing email');
    setSavingSignature(true);
    try {
      await signContract({ contractId: contract.id, signerName, signerEmail });
      toast.success('Agreement digitally signed');
      setSigningId('');
      setAccepted(false);
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to sign contract');
    } finally {
      setSavingSignature(false);
    }
  };

  if (showGenerator || editingContract) {
    return (
      <section className="glass rounded-3xl p-8">
        <ContractGenerator 
          project={project} 
          contract={editingContract} 
          onSave={handleSave} 
          onCancel={() => { setShowGenerator(false); setEditingContract(null); }} 
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-violet" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Legal Agreements</p>
          </div>
          <h3 className="mt-1 text-2xl font-bold text-white">Contracts</h3>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-night hover:bg-violet hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Contract
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {sortedContracts.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center rounded-2xl py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-500">
              <ScrollText className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-400">No contracts generated yet.</p>
          </div>
        ) : (
          sortedContracts.map((contract) => {
            const linkedPdf = contract.pdf_url || contract.contract_url;
            const link = normalizeAssetLink(linkedPdf);
            const canOpenLinkedPdf = linkedPdf && link.isValid;

            return (
            <div key={contract.id} className="group glass rounded-2xl p-5 transition-all hover:border-white/10 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 ${contract.signed ? 'text-aqua' : 'text-violet'}`}>
                    {contract.signed ? <ShieldCheck className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-white">{contract.title}</p>
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${contract.signed ? 'border-aqua/20 bg-aqua/10 text-aqua' : 'border-violet/20 bg-violet/10 text-violet'}`}>
                        {contract.signed ? 'signed' : contract.status || 'draft'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {contract.signed
                        ? `Signed by ${contract.signed_by || contract.client_name || 'client'} ${contract.signed_at ? `on ${formatDate(contract.signed_at)}` : ''}`
                        : `Created ${formatDate(contract.created_at)}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 xs:flex xs:items-center">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setEditingContract(contract)}
                        className="flex h-9 w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-white transition-colors xs:w-9"
                        title={contract.signed ? 'Admin override edit' : 'Edit Contract'}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeContract(contract)}
                        disabled={deletingId === contract.id}
                        className="flex h-9 w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-red-400 transition-colors xs:w-9"
                        title="Delete Contract"
                      >
                        {deletingId === contract.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </>
                  )}
                  {!isAdmin && !contract.signed && (
                    <button
                      type="button"
                      onClick={() => startSigning(contract)}
                      className="col-span-2 flex h-9 items-center justify-center gap-2 rounded-lg border border-aqua/20 bg-aqua/10 px-3 text-xs font-black text-aqua transition-colors hover:bg-aqua hover:text-night xs:col-span-1"
                      title="Digitally sign contract"
                    >
                      <FileSignature className="h-4 w-4" />
                      Sign
                    </button>
                  )}
                  {canOpenLinkedPdf && (
                    <>
                      <a
                        href={getInvoiceViewUrl(linkedPdf)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-9 w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-violet xs:w-9"
                        title="View Contract"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openAssetLink(getInvoiceDownloadUrl(linkedPdf), 'download')}
                        className="flex h-9 w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-violet xs:w-9"
                        title="Download Contract"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  
                  <PDFDownloadLink
                    document={<ContractPDF contract={contract} project={project} />}
                    fileName={`${contract.title}.pdf`}
                    className="flex h-9 w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-violet transition-colors xs:w-9"
                  >
                    {({ loading }) => (
                      loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />
                    )}
                  </PDFDownloadLink>
                </div>
              </div>

              {!isAdmin && signingId === contract.id && (
                <div className="mt-5 rounded-2xl border border-aqua/15 bg-aqua/[0.04] p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-aqua" />
                    <div>
                      <p className="text-sm font-black text-white">Digital agreement confirmation</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">Typing your legal name confirms you agree to this contract electronically via Zenvy Studio.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="section-label">Legal Full Name</label>
                      <input value={signerName} onChange={(event) => setSignerName(event.target.value)} className="field mt-1.5 px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="section-label">Signing Email</label>
                      <input type="email" value={signerEmail} onChange={(event) => setSignerEmail(event.target.value)} className="field mt-1.5 px-3 py-2.5 text-sm" />
                    </div>
                  </div>
                  <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-slate-300">
                    <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-cyan-400" />
                    <span>I have reviewed the agreement and consent to use an electronic signature for this contract.</span>
                  </label>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => setSigningId('')} className="btn-ghost">Cancel</button>
                    <button type="button" onClick={() => submitSignature(contract)} disabled={savingSignature} className="btn-primary">
                      {savingSignature ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Digitally Sign Agreement
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default memo(ContractPanel);
