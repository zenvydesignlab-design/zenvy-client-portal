import { Activity, FolderKanban, MessageSquare, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import StatCard from '../../components/StatCard';
import { formatDate, getMessages, getUsers } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { projects, loading } = useProjects();
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    Promise.all([getUsers(), getMessages(null, user)]).then(([users, allMessages]) => {
      setClients(users.filter((item) => item.role === 'client'));
      setMessages(allMessages);
    });
  }, [user]);

  if (loading) return <Loader label="Loading command center" />;

  const activity = [
    ...projects.slice(0, 4).map((project) => ({
      id: `project-${project.id}`,
      title: `${project.name} is ${project.progress}% complete`,
      detail: project.status,
      date: project.updated_at,
    })),
    ...messages.slice(-3).map((message) => ({
      id: `message-${message.id}`,
      title: message.text,
      detail: `${message.sender} message`,
      date: message.created_at,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <section className="glass rounded-3xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-2 w-2 rounded-full bg-aqua animate-pulse" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Command Center</p>
        </div>
        <h2 className="text-4xl font-bold tracking-tight text-white max-w-2xl leading-tight">A calm control panel for every client delivery.</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500">Manage assignments, progress, files, and conversations from one focused workspace.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Total Clients" value={clients.length} />
        <StatCard icon={FolderKanban} label="Active Projects" value={projects.length} tone="violet" />
        <StatCard icon={MessageSquare} label="All Messages" value={messages.length} tone="ember" />
        <StatCard icon={Activity} label="Avg Progress" value={`${projects.length ? Math.round(projects.reduce((sum, item) => sum + Number(item.progress), 0) / projects.length) : 0}%`} />
      </div>

      {activity.length ? (
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Recent activity</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last 6 events</span>
          </div>
          <div className="space-y-2">
            {activity.map((item) => (
              <div key={item.id} className="group flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white group-hover:text-aqua transition-colors">{item.title}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.detail}</p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatDate(item.date)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState title="No activity yet" text="Project and message activity will collect here." />
      )}
    </motion.div>
  );
}
