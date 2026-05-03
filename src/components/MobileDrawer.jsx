import { FolderKanban, LayoutDashboard, MessageSquare, Shield, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close menu overlay" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="glass-strong relative h-full w-[84vw] max-w-sm rounded-r-[2rem] p-5"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white font-black text-night">Z</div>
                <div>
                  <p className="text-lg font-black tracking-[0.16em]">ZENVY</p>
                  <p className="text-xs font-bold tracking-[0.32em] text-white/45">PORTAL</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-2">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${isActive ? 'bg-white text-night' : 'bg-white/[0.04] text-white/65'}`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
