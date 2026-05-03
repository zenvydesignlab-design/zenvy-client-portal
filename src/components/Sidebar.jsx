import { LayoutDashboard, MessageSquare, FolderKanban, Users, Shield, LogOut, Sparkles } from 'lucide-react';
import { memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

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
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 p-4 lg:block">
      <div className="glass-strong flex h-full flex-col rounded-[1.75rem] p-4">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-xl font-black text-night">Z</div>
          <div>
            <p className="text-xl font-black tracking-[0.16em]">ZENVY</p>
            <p className="text-xs font-bold tracking-[0.38em] text-white/45">PORTAL</p>
          </div>
        </div>

        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive ? 'text-night' : 'text-white/62 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-2xl bg-white shadow-glow"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="relative h-5 w-5" />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-aqua/15 bg-aqua/5 p-4">
          <Sparkles className="mb-3 h-5 w-5 text-aqua" />
          <p className="text-sm font-bold">Premium delivery space</p>
          <p className="mt-1 text-xs leading-5 text-white/48">Projects, files, approvals, and conversations in one polished portal.</p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="focus-ring mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-ember/40 hover:bg-ember/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
