import { LayoutDashboard, MessageSquare, FolderKanban, Users, Shield, LogOut, Sparkles, ChevronDown } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getProjects } from '../services/api';

const clientLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
];

const adminLinks = [
  { to: '/admin', label: 'Command', icon: Shield, end: true },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
];

function Sidebar({ admin }) {
  const links = admin ? adminLinks : clientLinks;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getProjects(user).then(setProjects).catch(() => {});
    }
  }, [user]);

  const activeProject = projects.find(p => location.pathname.includes(`/projects/${p.id}`));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/5 bg-night p-4 lg:block">
      <div className="flex h-full flex-col">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-night">
            <span className="text-lg font-black tracking-tighter">Z</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">Zenvy Portal</span>
        </div>

        {/* Project Switcher */}
        {projects.length > 0 && (
          <div className="relative mb-6 px-1">
            <button
              onClick={() => setProjectSwitcherOpen(!projectSwitcherOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-left transition-all hover:bg-white/[0.05]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">
                  {activeProject ? activeProject.name : 'Select Project'}
                </p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${projectSwitcherOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {projectSwitcherOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute left-1 right-1 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-night-light p-1.5 shadow-2xl backdrop-blur-xl"
                >
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        navigate(admin ? `/admin/projects/${project.id}` : `/projects/${project.id}`);
                        setProjectSwitcherOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all hover:bg-white/5 hover:text-white text-slate-400"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-aqua" />
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 px-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-4 px-1">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet" />
              <p className="text-[11px] font-bold text-white">Premium</p>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">Full access to project tools and shared assets.</p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
