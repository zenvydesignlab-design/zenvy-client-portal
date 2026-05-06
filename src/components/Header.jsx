import { ChevronDown, Loader2, Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { globalSearch } from '../services/api';
import NotificationCenter from './NotificationCenter';

const titles = {
  '/dashboard': 'Client Dashboard',
  '/messages': 'Messages',
  '/admin': 'Admin Command',
  '/admin/clients': 'Manage Clients',
  '/admin/projects': 'Manage Projects',
  '/admin/messages': 'Admin Messages',
};

export default function Header({ admin = false, onMenuClick }) {
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || (location.pathname.includes('/projects') || location.pathname.includes('/project/') ? 'Project Room' : 'Portal');
  const placeholder = admin ? 'Search projects, clients, invoices, files...' : 'Search your project files, invoices, updates...';

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const onPointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        setResults(await globalSearch(user, query));
      } catch (error) {
        toast.error(error.message || 'Search failed');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, user]);

  const openResult = (href) => {
    setSearchOpen(false);
    setQuery('');
    navigate(href);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-night/45 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div ref={searchRef} className="mx-auto flex max-w-7xl flex-wrap items-center gap-4">
        <button onClick={onMenuClick} className="focus-ring grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/75 lg:hidden" type="button" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-aqua/70">Zenvy Design Lab</p>
          <h1 className="truncate text-xl font-black tracking-tight sm:text-3xl">{title}</h1>
        </div>
        <div className="relative hidden min-w-[20rem] max-w-[28rem] flex-1 md:block">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white/70 transition focus-within:border-aqua/35 focus-within:bg-white/[0.065]">
            <Search className="h-4 w-4 shrink-0 text-white/45" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
            />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-aqua" />}
            {query && !searching && (
              <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); setResults([]); }} className="grid h-6 w-6 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {searchOpen && query.trim().length >= 2 && (
            <div className="glass-strong absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-3xl p-2">
              {searching ? (
                <div className="space-y-2 p-2">
                  {[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-2xl bg-white/[0.06]" />)}
                </div>
              ) : results.length ? (
                <div className="max-h-96 space-y-1 overflow-y-auto">
                  {results.map((item) => (
                    <button key={item.id} type="button" onClick={() => openResult(item.href)} className="focus-ring w-full rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.07]">
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-black">{item.title}</span>
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-black uppercase text-aqua/75">{item.type}</span>
                      </span>
                      <span className="mt-1 block truncate text-xs font-bold text-white/42">{item.description}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-center">
                  <p className="text-sm font-black">No matches found</p>
                  <p className="mt-1 text-xs leading-5 text-white/42">{admin ? 'Try a client, invoice, approval, or project term.' : 'Only your own projects, files, invoices, and messages are searchable.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <NotificationCenter />
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
        <div className="relative order-last w-full md:hidden">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white/70 transition focus-within:border-aqua/35">
            <Search className="h-4 w-4 shrink-0 text-white/45" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
            />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-aqua" />}
          </div>
          {searchOpen && query.trim().length >= 2 && (
            <div className="glass-strong absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-3xl p-2">
              {searching ? (
                <div className="space-y-2 p-2">
                  {[0, 1].map((item) => <div key={item} className="h-12 animate-pulse rounded-2xl bg-white/[0.06]" />)}
                </div>
              ) : results.length ? (
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {results.map((item) => (
                    <button key={`mobile-${item.id}`} type="button" onClick={() => openResult(item.href)} className="focus-ring w-full rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.07]">
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-black">{item.title}</span>
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-black uppercase text-aqua/75">{item.type}</span>
                      </span>
                      <span className="mt-1 block truncate text-xs font-bold text-white/42">{item.description}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-center">
                  <p className="text-sm font-black">No matches found</p>
                  <p className="mt-1 text-xs leading-5 text-white/42">{admin ? 'Try a wider global search term.' : 'Only your own portal content is searched.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
