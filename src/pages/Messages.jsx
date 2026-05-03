import { MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ChatBox from '../components/ChatBox';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { getMessages } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';

export default function Messages() {
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

  if (loading) return <Loader label="Loading inbox" />;
  if (!projects.length) return <EmptyState title="No message threads" text="Threads appear when a project has been assigned." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside className="glass rounded-3xl p-4">
        <div className="mb-4 flex items-center gap-2 px-2">
          <MessageSquare className="h-5 w-5 text-aqua" />
          <h2 className="text-xl font-black">Threads</h2>
        </div>
        <div className="space-y-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              className={`focus-ring w-full rounded-2xl px-4 py-3 text-left transition ${activeProjectId === project.id ? 'bg-white text-night' : 'bg-white/[0.04] text-white/68 hover:bg-white/10'}`}
              type="button"
            >
              <span className="block text-sm font-black">{project.name}</span>
              <span className="text-xs opacity-60">{project.status}</span>
            </button>
          ))}
        </div>
      </aside>
      <ChatBox projectId={activeProjectId} messages={messages} onSent={loadMessages} />
    </div>
  );
}
