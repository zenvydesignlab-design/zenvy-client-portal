import { CalendarDays, CheckCircle2, Clock3, Download, FileText, FolderOpen, Sparkles, Target } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ActivityTimeline from '../components/ActivityTimeline';
import ChatBox from '../components/ChatBox';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import MeetingPanel from '../components/MeetingPanel';
import ProgressBar from '../components/ProgressBar';
import ProjectAssetsHub from '../components/ProjectAssetsHub';
import ProjectQuestions from '../components/ProjectQuestions';
import StatusBadge from '../components/StatusBadge';
import UploadDropzone from '../components/UploadDropzone';
import { formatDate, getApprovals, getContracts, getFiles, getInvoices, getMeetings, getMessages, getProject } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ApprovalPanel = lazy(() => import('../components/ApprovalPanel'));
const ContractPanel = lazy(() => import('../components/ContractPanel'));
const InvoicePanel = lazy(() => import('../components/InvoicePanel'));

const phases = ['Discovery', 'Wireframing', 'Design', 'Development', 'Review', 'Delivered'];

function PanelFallback({ label = 'Loading section' }) {
  return (
    <div className="surface grid min-h-48 place-items-center rounded-3xl p-6 text-sm font-bold text-white/45">
      {label}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone = 'aqua' }) {
  const toneClass = tone === 'violet' ? 'text-violet' : tone === 'ember' ? 'text-ember' : 'text-aqua';
  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="metric-label">{label}</p>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <p className="mt-3 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

export default function Project() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectData, fileData, messageData, invoiceData, contractData, meetingData, approvalData] = await Promise.all([
        getProject(projectId, user),
        getFiles(projectId),
        getMessages(projectId, user),
        getInvoices(projectId),
        getContracts(projectId),
        getMeetings(projectId),
        getApprovals(projectId),
      ]);
      setProject(projectData);
      setFiles(fileData);
      setMessages(messageData);
      setInvoices(invoiceData);
      setContracts(contractData);
      setMeetings(meetingData);
      setApprovals(approvalData);
    } catch (err) {
      setError(err.message || 'Unable to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const projectMeta = useMemo(() => {
    if (!project) return null;
    const currentPhaseIndex = Math.max(0, phases.indexOf(project.status));
    const nextPhase = phases[Math.min(phases.length - 1, currentPhaseIndex + 1)];
    const deadline = project.deadline || project.due_date;
    const deliverables = [
      { label: 'Creative direction', active: currentPhaseIndex >= 1, detail: 'Strategy and visual references aligned' },
      { label: 'Design review pack', active: currentPhaseIndex >= 2, detail: 'Core screens and feedback loop' },
      { label: 'Responsive build', active: currentPhaseIndex >= 3, detail: 'Implementation, QA, and handoff' },
      { label: 'Launch handoff', active: currentPhaseIndex >= 5, detail: 'Final files and post-launch guidance' },
    ];

    const timeline = [
      ...files.slice(0, 4).map((file) => ({ id: `file-${file.id}`, title: `${file.name || 'File'} uploaded`, detail: 'Portal file', date: file.uploaded_at, kind: 'upload' })),
      ...messages.slice(-4).map((message) => ({ id: `message-${message.id}`, title: message.text, detail: `${message.sender} message`, date: message.created_at, kind: 'message' })),
      ...approvals.slice(0, 4).map((approval) => ({ id: `approval-${approval.id}`, title: approval.title, detail: approval.status, date: approval.created_at, kind: 'approval' })),
      { id: 'status', title: `${project.status} phase confirmed`, detail: `${project.progress}% complete`, date: project.updated_at, kind: 'status' },
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8);

    return { currentPhaseIndex, nextPhase, deadline, deliverables, timeline };
  }, [approvals, files, messages, project]);

  if (loading) return <Loader label="Opening project room" />;
  if (error) return <EmptyState title="Project could not load" text={error} />;
  if (!project || !projectMeta) return <EmptyState title="Project unavailable" text="This project either does not exist or is not assigned to your account." />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-aqua" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Project Workspace</p>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{project.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{project.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status={project.status} />
          <div className="hidden sm:block h-8 w-[1px] bg-white/10" />
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Deadline</p>
            <p className="text-sm font-semibold text-white">{projectMeta.deadline ? formatDate(projectMeta.deadline) : 'TBD'}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Left Sidebar: Progress & Milestones */}
        <aside className="space-y-8 xl:col-span-3">
          <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Progress</h3>
              <span className="text-xs font-bold text-aqua">{project.progress}%</span>
            </div>
            <ProgressBar value={project.progress} />
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/10 text-violet">
                <Target className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Next Phase</p>
                <p className="truncate text-xs font-semibold text-white">{projectMeta.nextPhase}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-5">Milestones</h3>
            <div className="space-y-1.5">
              {phases.map((phase, index) => {
                const active = index <= projectMeta.currentPhaseIndex;
                const isCurrent = index === projectMeta.currentPhaseIndex;
                return (
                  <div key={phase} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isCurrent ? 'bg-white/5 border border-white/10' : 'border border-transparent'}`}>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${active ? 'bg-aqua text-night' : 'bg-white/5 text-slate-500'}`}>
                      {active ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                    </div>
                    <span className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-500'}`}>{phase}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-5">Deliverables</h3>
            <div className="grid gap-3">
              {projectMeta.deliverables.map((item) => (
                <div key={item.label} className={`rounded-xl border p-4 transition-all bg-white/[0.01] ${item.active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.label}</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-2">{item.detail}</p>
                    </div>
                    {item.active && <div className="mt-1 h-1.5 w-1.5 rounded-full bg-aqua shadow-glow shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 space-y-8 xl:col-span-6">
          <ProjectAssetsHub project={project} files={files} isAdmin={isAdmin} onChanged={load} />

          <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-aqua" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Portal Files</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{files.length} items</span>
            </div>
            
            <div className="space-y-6">
              <UploadDropzone projectId={project.id} userId={user.id} onUploaded={load} compact />
              <div className="grid gap-2">
                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                    <p className="text-xs text-slate-600">No portal files yet.</p>
                  </div>
                ) : (
                  files.slice(0, 5).map((file) => (
                    <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-3 transition-all hover:border-white/10 hover:bg-white/[0.03]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white">{file.name || 'Untitled File'}</p>
                          <p className="text-[10px] text-slate-600">{formatDate(file.uploaded_at)}</p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-slate-500 hover:text-white transition-colors" />
                    </a>
                  ))
                )}
              </div>
            </div>
          </section>

          <ProjectQuestions project={project} isAdmin={isAdmin} />

          <div className="space-y-8">
            <Suspense fallback={<PanelFallback label="Loading invoices" />}>
              <InvoicePanel project={project} invoices={invoices} isAdmin={isAdmin} onChanged={load} />
            </Suspense>

            <Suspense fallback={<PanelFallback label="Loading contracts" />}>
              <ContractPanel project={project} contracts={contracts} isAdmin={isAdmin} onChanged={load} />
            </Suspense>
          </div>
        </main>

        {/* Right Sidebar: Activity & Communication */}
        <aside className="space-y-8 xl:col-span-3">
          <div className="sticky top-24 space-y-8">
            <ChatBox projectId={project.id} messages={messages} onSent={load} compact />
            
            <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock3 className="h-4 w-4 text-violet" />
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Recent Activity</h3>
              </div>
              <ActivityTimeline items={projectMeta.timeline} compact />
            </section>

            <Suspense fallback={<PanelFallback label="Loading approvals" />}>
              <ApprovalPanel project={project} approvals={approvals} isAdmin={isAdmin} onChanged={load} />
            </Suspense>

            <MeetingPanel project={project} meetings={meetings} isAdmin={isAdmin} onChanged={load} />
          </div>
        </aside>
      </div>
    </div>
  );
}
