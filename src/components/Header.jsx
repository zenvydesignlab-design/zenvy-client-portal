import { Bell, ChevronDown, Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const titles = {
  '/dashboard': 'Client Dashboard',
  '/messages': 'Messages',
  '/admin': 'Admin Command',
  '/admin/clients': 'Manage Clients',
  '/admin/projects': 'Manage Projects',
  '/admin/messages': 'Admin Messages',
};

export default function Header({ onMenuClick }) {
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || (location.pathname.includes('/projects') || location.pathname.includes('/project/') ? 'Project Room' : 'Portal');

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-night/45 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <button onClick={onMenuClick} className="focus-ring grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/75 lg:hidden" type="button" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-aqua/70">Zenvy Design Lab</p>
          <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        </div>
        <div className="hidden min-w-72 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white/45 md:flex">
          <Search className="h-4 w-4" />
          <span>Search projects, clients, files</span>
        </div>
        <button className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-white/70 transition hover:text-white" type="button" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <div className="relative">
          <button
            className="focus-ring flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] py-2 pl-2 pr-3 text-left transition hover:bg-white/10"
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-aqua to-violet text-sm font-black text-night">
              {user?.email?.[0]?.toUpperCase() || 'Z'}
            </span>
            <span className="hidden sm:block">
              <span className="block max-w-40 truncate text-sm font-bold">{user?.email}</span>
              <span className="block text-xs capitalize text-white/45">{user?.role}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-white/45 sm:block" />
          </button>
          {profileOpen && (
            <div className="glass-strong absolute right-0 mt-3 w-64 rounded-3xl p-3">
              <div className="border-b border-white/10 px-3 pb-3">
                <p className="truncate text-sm font-black">{user?.email}</p>
                <p className="text-xs capitalize text-white/45">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="focus-ring mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-night transition hover:bg-aqua"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
