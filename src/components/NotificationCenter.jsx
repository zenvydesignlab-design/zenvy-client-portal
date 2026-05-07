import { Bell, Check, Circle, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, getNotifications, markNotificationRead } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    getNotifications(user)
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, [user]);

  const derived = useMemo(() => {
    if (notifications.length) return notifications;
    return [
      { id: 'welcome', title: 'Welcome to Zenvy Portal', body: 'Your project workspace is ready.', created_at: new Date().toISOString(), read_at: null },
      { id: 'drive', title: 'Assets live in Google Drive', body: 'Heavy media and source files should stay in the project Drive folder.', created_at: new Date().toISOString(), read_at: new Date().toISOString() },
    ];
  }, [notifications]);

  // Auto-hide read notifications by filtering them out of the main view (optional) or just keeping unread count accurate
  const activeNotifications = derived.filter((item) => !item.cleared);
  const unread = activeNotifications.filter((item) => !item.read_at).length;

  const markRead = async (item) => {
    if (String(item.id).startsWith('welcome') || String(item.id).startsWith('drive')) return;
    try {
      await markNotificationRead(item.id);
      setNotifications((current) => current.map((notification) => (
        notification.id === item.id ? { ...notification, read_at: new Date().toISOString() } : notification
      )));
    } catch (error) {
      toast.error(error.message || 'Unable to update notification');
    }
  };

  const clearNotification = (id, e) => {
    e.stopPropagation();
    setNotifications((current) => current.map((n) => n.id === id ? { ...n, cleared: true } : n));
  };

  const clearAll = () => {
    setNotifications((current) => current.map((n) => ({ ...n, cleared: true })));
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-slate-400 transition hover:bg-white/[0.05] hover:text-white" type="button" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-aqua px-1 text-[9px] font-bold text-night shadow-glow">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-night-light/95 p-3 shadow-2xl backdrop-blur-xl z-50"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-2 pb-3 mb-2">
              <p className="text-xs font-bold text-white uppercase tracking-widest">Notifications</p>
              {activeNotifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                  Clear All
                </button>
              )}
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {activeNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-500">You're all caught up.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {activeNotifications.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`group relative flex w-full flex-col rounded-xl border p-3 text-left transition-all ${!item.read_at ? 'border-aqua/20 bg-aqua/5' : 'border-transparent hover:bg-white/[0.03]'}`}
                    >
                      <button type="button" onClick={() => markRead(item)} className="absolute inset-0 z-0" aria-label="Mark read" />
                      <div className="relative z-10 flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {item.read_at ? <Check className="h-3.5 w-3.5 text-slate-600" /> : <Circle className="h-3.5 w-3.5 fill-aqua text-aqua" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold ${!item.read_at ? 'text-white' : 'text-slate-300'}`}>{item.title}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">{item.body}</p>
                          <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">{formatDate(item.created_at)}</p>
                        </div>
                        <button onClick={(e) => clearNotification(item.id, e)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-white rounded-md hover:bg-white/10">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
