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
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[1.35rem] border border-white/10 bg-night/80 p-2 shadow-glow backdrop-blur-2xl lg:hidden">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition ${
                isActive ? 'bg-white text-night' : 'text-white/55'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
