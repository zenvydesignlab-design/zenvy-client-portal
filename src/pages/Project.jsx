import { Download, FileText, History, Layers } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatBox from '../components/ChatBox';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import ProjectQuestions from '../components/ProjectQuestions';
import UploadDropzone from '../components/UploadDropzone';
import { formatDate, getFiles, getMessages, getProject } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Project() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectData, fileData, messageData] = await Promise.all([
        getProject(projectId, user),
        getFiles(projectId),
        getMessages(projectId, user),
      ]);
      setProject(projectData);
      setFiles(fileData);
      setMessages(messageData);
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
    { title: `${project.status} status confirmed`, date: project.updated_at },
    { title: 'Latest files and notes synchronized', date: project.updated_at },
    { title: 'Project room created', date: project.updated_at },
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
            <span className="rounded-full border border-aqua/25 bg-aqua/10 px-4 py-2 text-sm font-black text-aqua">{project.status}</span>
          </div>
          <ProgressBar value={project.progress} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-3xl p-5">
            <div className="mb-5 flex items-center gap-3">
              <FileText className="h-5 w-5 text-aqua" />
              <h3 className="text-xl font-black">Files</h3>
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
              <History className="h-5 w-5 text-violet" />
              <h3 className="text-xl font-black">Updates</h3>
            </div>
            <div className="space-y-4">
              {timeline.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-violet/20 bg-violet/10">
                    <Layers className="h-3.5 w-3.5 text-violet" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{item.title}</span>
                    <span className="text-xs text-white/40">{formatDate(item.date)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <ProjectQuestions projectId={project.id} user={user} />
      </div>
      <ChatBox projectId={project.id} messages={messages} onSent={load} />
    </motion.div>
  );
}
