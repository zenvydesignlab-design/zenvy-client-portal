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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <section className="glass overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_26rem]">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-aqua/75">Welcome to Zenvy Portal</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your project cockpit is ready, {user.email.split('@')[0]}.</h2>
            <p className="mt-4 text-base leading-7 text-white/54">Track active work, review updates, open your assets hub, answer brief questions, and keep decisions moving.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <Clock className="mb-3 h-5 w-5 text-aqua" />
                <p className="text-sm font-black">Current phase</p>
                <p className="mt-1 text-xs text-white/45">{primaryProject?.status || 'Awaiting project'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <Sparkles className="mb-3 h-5 w-5 text-violet" />
                <p className="text-sm font-black">Next action</p>
                <p className="mt-1 text-xs text-white/45">{checklist.find((item) => !item.done)?.label || 'Review latest update'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-200" />
                <p className="text-sm font-black">Onboarding</p>
                <p className="mt-1 text-xs text-white/45">{completedSteps} of {checklist.length} complete</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-night/35 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black">Onboarding checklist</p>
              <span className="rounded-full border border-aqua/20 bg-aqua/10 px-3 py-1 text-xs font-black text-aqua">{Math.round((completedSteps / checklist.length) * 100)}%</span>
            </div>
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${item.done ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-white/10 bg-white/5 text-white/35'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className={`text-sm font-bold ${item.done ? 'text-white' : 'text-white/52'}`}>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FolderKanban} label="Active projects" value={projects.length} />
        <StatCard icon={TrendingUp} label="Average progress" value={`${average}%`} tone="violet" />
        <StatCard icon={MessageSquare} label="Open threads" value={projects.length} tone="ember" />
      </div>

      {error && <div className="rounded-2xl border border-ember/30 bg-ember/10 p-4 text-sm font-bold text-ember">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        {projects.length === 0 ? (
        <EmptyState title="No projects assigned" text="Your assigned projects will appear here as soon as the team creates them." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-5 text-xl font-black">Latest updates</h3>
          {latestActivity.length ? <ActivityTimeline items={latestActivity} compact /> : <p className="text-sm text-white/45">Updates will appear here once your project starts moving.</p>}
        </div>
      </section>
    </motion.div>
  );
}
