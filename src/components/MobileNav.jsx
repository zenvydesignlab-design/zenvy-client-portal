import { FolderKanban, LayoutDashboard, MessageSquare, Shield, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const clientLinks = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/messages', label: 'Chat', icon: MessageSquare },
];

const adminLinks = [
  { to: '/admin', label: 'Admin', icon: Shield, end: true },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/messages', label: 'Chat', icon: MessageSquare },
];

export default function MobileNav({ admin }) {
  const links = admin ? adminLinks : clientLinks;
  return (
    <nav className="fixed inset-x-6 bottom-8 z-40 rounded-xl border border-white/5 bg-night/60 p-1 shadow-2xl backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1.5 rounded-lg py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${
                isActive ? 'bg-white/10 text-white' : 'text-slate-500'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
