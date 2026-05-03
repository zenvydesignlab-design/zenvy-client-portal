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
      <section className="glass rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-aqua/75">Owner overview</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">A calm control panel for every client delivery.</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/54">Manage assignments, progress, files, and conversations from one focused workspace.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Clients" value={clients.length} />
        <StatCard icon={FolderKanban} label="Projects" value={projects.length} tone="violet" />
        <StatCard icon={MessageSquare} label="Messages" value={messages.length} tone="ember" />
        <StatCard icon={Activity} label="Avg progress" value={`${projects.length ? Math.round(projects.reduce((sum, item) => sum + Number(item.progress), 0) / projects.length) : 0}%`} />
      </div>

      {activity.length ? (
        <section className="glass rounded-3xl p-5">
          <h3 className="mb-5 text-xl font-black">Recent activity</h3>
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  <p className="text-xs capitalize text-white/42">{item.detail}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-white/42">{formatDate(item.date)}</span>
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
