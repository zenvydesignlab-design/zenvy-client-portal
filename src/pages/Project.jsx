import { CalendarDays, Download, FileText, Target } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ActivityTimeline from '../components/ActivityTimeline';
import ApprovalPanel from '../components/ApprovalPanel';
import ChatBox from '../components/ChatBox';
import ContractPanel from '../components/ContractPanel';
import EmptyState from '../components/EmptyState';
import InvoicePanel from '../components/InvoicePanel';
import Loader from '../components/Loader';
import MeetingPanel from '../components/MeetingPanel';
import ProgressBar from '../components/ProgressBar';
import ProjectAssetsHub from '../components/ProjectAssetsHub';
import ProjectQuestions from '../components/ProjectQuestions';
import StatusBadge from '../components/StatusBadge';
import UploadDropzone from '../components/UploadDropzone';
import { formatDate, getApprovals, getContracts, getFiles, getInvoices, getMeetings, getMessages, getProject } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const phases = ['Discovery', 'Wireframing', 'Design', 'Development', 'Review', 'Delivered'];

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
  const isAdmin = user.role === 'admin';

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

  if (loading) return <Loader label="Opening project room" />;
  if (error) return <EmptyState title="Project could not load" text={error} />;
  if (!project) return <EmptyState title="Project unavailable" text="This project either does not exist or is not assigned to your account." />;

  const timeline = [
    ...files.slice(0, 3).map((file) => ({ id: `file-${file.id}`, title: `${file.name || 'File'} uploaded`, detail: 'Lightweight portal file', date: file.uploaded_at, kind: 'upload' })),
    ...messages.slice(-3).map((message) => ({ id: `message-${message.id}`, title: message.text, detail: `${message.sender} message`, date: message.created_at, kind: 'message' })),
    ...approvals.slice(0, 3).map((approval) => ({ id: `approval-${approval.id}`, title: approval.title, detail: approval.status, date: approval.created_at, kind: 'approval' })),
    { id: 'status', title: `${project.status} phase confirmed`, detail: `${project.progress}% complete`, date: project.updated_at, kind: 'status' },
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  const currentPhaseIndex = Math.max(0, phases.indexOf(project.status));
  const nextPhase = phases[Math.min(phases.length - 1, currentPhaseIndex + 1)];
  const deadline = project.deadline || project.due_date;

  const deliverables = [
    { label: 'Creative direction', active: currentPhaseIndex >= 1 },
    { label: 'Design review pack', active: currentPhaseIndex >= 2 },
    { label: 'Responsive build', active: currentPhaseIndex >= 3 },
    { label: 'Launch handoff', active: currentPhaseIndex >= 5 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 xl:grid-cols-[1fr_26rem]">
      <div className="space-y-6">
        <section className="glass rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-aqua/75">Project overview</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">{project.name}</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/54">{project.description}</p>
            </div>
            <StatusBadge status={project.status} />
          </div>
          <ProgressBar value={project.progress} />
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <Target className="mb-3 h-5 w-5 text-aqua" />
              <p className="text-sm font-black">Current phase</p>
              <p className="mt-1 text-xs text-white/45">{project.status}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <CalendarDays className="mb-3 h-5 w-5 text-violet" />
              <p className="text-sm font-black">Deadline</p>
              <p className="mt-1 text-xs text-white/45">{deadline ? formatDate(deadline) : 'To be confirmed'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <Target className="mb-3 h-5 w-5 text-ember" />
              <p className="text-sm font-black">Next milestone</p>
              <p className="mt-1 text-xs text-white/45">{nextPhase}</p>
            </div>
          </div>
          <div className="mt-7 grid gap-2 sm:grid-cols-6">
            {phases.map((phase, index) => (
              <div key={phase} className={`rounded-2xl border px-3 py-3 text-center text-[11px] font-black ${index <= currentPhaseIndex ? 'border-aqua/25 bg-aqua/10 text-aqua' : 'border-white/10 bg-white/[0.035] text-white/35'}`}>
                {phase}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ProjectAssetsHub project={project} isAdmin={isAdmin} onChanged={load} />
          <div className="glass rounded-3xl p-5">
            <div className="mb-5 flex items-center gap-3">
              <FileText className="h-5 w-5 text-aqua" />
              <h3 className="text-xl font-black">Portal files</h3>
            </div>
            <div className="space-y-3">
              <UploadDropzone projectId={project.id} userId={user.id} onUploaded={load} compact />
              {files.length === 0 ? (
                <p className="text-sm text-white/45">No files uploaded yet.</p>
              ) : (
                files.map((file) => (
                  <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-aqua/30">
                    <span>
                      <span className="block text-sm font-bold">{file.name || file.file_url.split('/').pop()}</span>
                      <span className="text-xs text-white/40">{formatDate(file.uploaded_at)}</span>
                    </span>
                    <Download className="h-5 w-5 text-white/55" />
                  </a>
                ))
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="mb-5 flex items-center gap-3">
              <Target className="h-5 w-5 text-violet" />
              <h3 className="text-xl font-black">Upcoming deliverables</h3>
            </div>
            <div className="space-y-3">
              {deliverables.map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 ${item.active ? 'border-aqua/20 bg-aqua/[0.06]' : 'border-white/10 bg-white/[0.035]'}`}>
                  <p className="text-sm font-black">{item.label}</p>
                  <p className="mt-1 text-xs text-white/42">{item.active ? 'In motion or completed' : 'Queued for the next phase'}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl p-5">
            <h3 className="mb-5 text-xl font-black">Activity timeline</h3>
            <ActivityTimeline items={timeline} compact />
          </div>
        </section>
        <ProjectQuestions projectId={project.id} user={user} />
        <section className="grid gap-6 lg:grid-cols-2">
          <ApprovalPanel projectId={project.id} approvals={approvals} isAdmin={isAdmin} onChanged={load} />
          <InvoicePanel projectId={project.id} invoices={invoices} isAdmin={isAdmin} onChanged={load} />
          <ContractPanel projectId={project.id} contracts={contracts} isAdmin={isAdmin} onChanged={load} />
          <MeetingPanel projectId={project.id} meetings={meetings} isAdmin={isAdmin} onChanged={load} />
        </section>
      </div>
      <ChatBox projectId={project.id} messages={messages} onSent={load} />
    </motion.div>
  );
}
