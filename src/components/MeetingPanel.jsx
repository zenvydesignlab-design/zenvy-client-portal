import { CalendarClock, ExternalLink, Save, Video } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { formatDate, saveMeeting } from '../services/api';

export default function MeetingPanel({ projectId, meetings = [], isAdmin = false, onChanged }) {
  const [form, setForm] = useState({ title: 'Kickoff / review call', starts_at: '', meeting_url: '' });

  const submit = async () => {
    if (!form.meeting_url.trim()) return;
    try {
      await saveMeeting({ ...form, project_id: projectId });
      toast.success('Meeting saved');
      setForm({ title: 'Kickoff / review call', starts_at: '', meeting_url: '' });
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to save meeting');
    }
  };

  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-5 flex items-center gap-3">
        <CalendarClock className="h-5 w-5 text-violet" />
        <h3 className="text-xl font-black">Meetings</h3>
      </div>
      {isAdmin && (
        <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Meeting title" className="focus-ring w-full rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white" />
          <input value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} type="datetime-local" className="focus-ring w-full rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white" />
          <input value={form.meeting_url} onChange={(event) => setForm({ ...form, meeting_url: event.target.value })} placeholder="Calendly or Google Meet link" className="focus-ring w-full rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
          <button type="button" onClick={submit} className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-night transition hover:bg-aqua">
            <Save className="h-4 w-4" />
            Save meeting
          </button>
        </div>
      )}
      <div className="space-y-3">
        {meetings.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/45">No upcoming meeting links yet.</p>
        ) : meetings.map((meeting) => (
          <a key={meeting.id} href={meeting.meeting_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-violet/35">
            <span className="min-w-0">
              <span className="flex items-center gap-2 truncate text-sm font-black"><Video className="h-4 w-4 text-violet" />{meeting.title}</span>
              <span className="text-xs text-white/42">{formatDate(meeting.starts_at)}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-white/45" />
          </a>
        ))}
      </div>
    </section>
  );
}
