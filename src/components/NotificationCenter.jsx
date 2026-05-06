import { Bell, Check, Circle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
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
  const unread = derived.filter((item) => !item.read_at).length;

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

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="focus-ring relative grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-white/70 transition hover:text-white" type="button" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1 text-[10px] font-black text-white">{unread}</span>}
      </button>
      {open && (
        <div className="glass-strong absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl p-3">
          <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3">
            <p className="text-sm font-black">Notifications</p>
            <span className="text-xs font-bold text-white/42">{unread} unread</span>
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {derived.map((item) => (
              <button key={item.id} type="button" onClick={() => markRead(item)} className="focus-ring w-full rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.065]">
                <span className="flex items-start gap-3">
                  {item.read_at ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/35" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 fill-aqua text-aqua" />}
                  <span className="min-w-0">
                    <span className="block text-sm font-black">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-white/45">{item.body}</span>
                    <span className="mt-1 block text-[11px] font-bold text-white/32">{formatDate(item.created_at)}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
