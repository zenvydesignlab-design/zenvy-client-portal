import { FolderKanban, LayoutDashboard, MessageSquare, Shield, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';

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

export default function MobileDrawer({ admin, open, onClose }) {
  const links = admin ? adminLinks : clientLinks;
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close menu overlay" className="absolute inset-0 bg-night/80 backdrop-blur-md" onClick={onClose} />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass relative h-full w-[80vw] max-w-sm rounded-r-3xl p-6"
          >
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aqua to-violet shadow-glow">
                  <span className="text-xl font-black text-white">Z</span>
                </div>
                <div>
                  <p className="text-lg font-black tracking-tighter text-white">ZENVY</p>
                  <p className="text-[10px] font-bold tracking-[0.4em] text-slate-500 uppercase">Studio</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) => 
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-5 w-5 ${isActive ? 'text-aqua' : ''}`} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
