import { CheckCircle2, Clock, FolderKanban, MessageSquare, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import ActivityTimeline from '../components/ActivityTimeline';
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
  const primaryProject = projects[0];
  const checklist = [
    { label: 'Complete onboarding brief', done: primaryProject?.progress >= 20 },
    { label: 'Upload brand assets in Drive', done: Boolean(primaryProject?.drive_folder_url) },
    { label: 'Review project timeline', done: primaryProject?.progress >= 35 },
    { label: 'Schedule kickoff call', done: primaryProject?.progress >= 45 },
  ];
  const completedSteps = checklist.filter((item) => item.done).length;
  const latestActivity = projects.slice(0, 5).map((project) => ({
    id: project.id,
    title: `${project.name} moved through ${project.status}`,
    detail: `${project.progress}% complete`,
    date: project.updated_at,
    kind: 'status',
  }));

  if (loading) return <Loader label="Loading projects" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01] p-8 sm:p-10">
        <div className="relative z-10 grid gap-10 xl:grid-cols-[1fr_24rem]">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-aqua" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Workspace Overview</p>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Welcome back, {user.email.split('@')[0]}.</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">Your creative cockpit is ready. Track active work, review updates, and manage your project assets in one place.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Current phase</p>
                <p className="text-sm font-semibold text-white">{primaryProject?.status || 'Awaiting project'}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Next action</p>
                <p className="text-sm font-semibold text-white truncate">{checklist.find((item) => !item.done)?.label || 'Review latest update'}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Onboarding</p>
                <p className="text-sm font-semibold text-white">{completedSteps} of {checklist.length} steps</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-night-light/50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-white">Onboarding Checklist</p>
              <span className="text-xs font-bold text-aqua">{Math.round((completedSteps / checklist.length) * 100)}%</span>
            </div>
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${item.done ? 'border-aqua/30 bg-aqua/10 text-aqua' : 'border-white/10 bg-white/5 text-white/20'}`}>
                    {item.done && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  <span className={`text-xs font-medium ${item.done ? 'text-white/80 line-through' : 'text-white'}`}>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-aqua/5 blur-[100px]" />
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard icon={FolderKanban} label="Active projects" value={projects.length} />
        <StatCard icon={TrendingUp} label="Average progress" value={`${average}%`} tone="violet" />
        <StatCard icon={MessageSquare} label="Open threads" value={projects.length} tone="ember" />
      </div>

      <section className="grid gap-8 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Active Work</h3>
          </div>
          {projects.length === 0 ? (
            <EmptyState title="No projects assigned" text="Your assigned projects will appear here as soon as the team creates them." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          )}
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Latest updates</h3>
          </div>
          {latestActivity.length ? <ActivityTimeline items={latestActivity} compact /> : <p className="text-xs text-slate-500">Updates will appear here once your project starts moving.</p>}
        </div>
      </section>
    </motion.div>
  );
}
