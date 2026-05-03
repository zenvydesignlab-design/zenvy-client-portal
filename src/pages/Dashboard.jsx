import { FolderKanban, MessageSquare, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ProjectCard from '../components/ProjectCard';
import StatCard from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';

export default function Dashboard() {
  const { user } = useAuth();
  const { projects, loading, error } = useProjects();
  const average = projects.length ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress), 0) / projects.length) : 0;

  if (loading) return <Loader label="Loading projects" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <section className="glass overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-aqua/75">Welcome back</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your project cockpit is ready, {user.email.split('@')[0]}.</h2>
          <p className="mt-4 text-base leading-7 text-white/54">Track active work, review updates, download files, and keep decisions moving.</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FolderKanban} label="Active projects" value={projects.length} />
        <StatCard icon={TrendingUp} label="Average progress" value={`${average}%`} tone="violet" />
        <StatCard icon={MessageSquare} label="Open threads" value={projects.length} tone="ember" />
      </div>

      {error && <div className="rounded-2xl border border-ember/30 bg-ember/10 p-4 text-sm font-bold text-ember">{error}</div>}

      {projects.length === 0 ? (
        <EmptyState title="No projects assigned" text="Your assigned projects will appear here as soon as the team creates them." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </motion.div>
  );
}
