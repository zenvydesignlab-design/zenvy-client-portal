import { useCallback, useEffect, useState } from 'react';
import ChatBox from '../../components/ChatBox';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import { getMessages } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';

export default function AdminMessages() {
  const { user } = useAuth();
  const { projects, loading } = useProjects();
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!activeProjectId && projects[0]) setActiveProjectId(projects[0].id);
  }, [projects, activeProjectId]);

  const loadMessages = useCallback(async () => {
    if (!activeProjectId) return;
    setMessages(await getMessages(activeProjectId, user));
  }, [activeProjectId, user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  if (loading) return <Loader label="Loading admin inbox" />;
  if (!projects.length) return <EmptyState title="No project chats" text="Create a project to open a client conversation." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[21rem_1fr]">
      <aside className="glass rounded-3xl p-4">
        <h2 className="mb-4 px-2 text-xl font-black">All chats</h2>
        <div className="space-y-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              className={`focus-ring w-full rounded-2xl px-4 py-3 text-left transition ${activeProjectId === project.id ? 'bg-white text-night' : 'bg-white/[0.04] text-white/68 hover:bg-white/10'}`}
              type="button"
            >
              <span className="block text-sm font-black">{project.name}</span>
              <span className="text-xs opacity-60">{project.status} · {project.progress}%</span>
            </button>
          ))}
        </div>
      </aside>
      <ChatBox projectId={activeProjectId} messages={messages} onSent={loadMessages} />
    </div>
  );
}
