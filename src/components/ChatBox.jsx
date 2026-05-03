import { Send } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { sendMessage, formatDate } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function ChatBox({ projectId, messages, onSent }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage({ project_id: projectId, sender: user.role, text });
      setText('');
      onSent?.();
    } catch (error) {
      toast.error(error.message || 'Message failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass flex h-[34rem] flex-col rounded-3xl">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-xl font-black">Conversation</h2>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-white/45">
            <p>No messages yet.</p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.sender === user.role;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-3xl px-4 py-3 ${mine ? 'bg-aqua text-night' : 'border border-white/10 bg-white/8 text-white'}`}>
                  <p className="text-sm font-semibold leading-6">{message.text}</p>
                  <p className={`mt-2 text-[11px] font-bold ${mine ? 'text-night/55' : 'text-white/38'}`}>{formatDate(message.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3 border-t border-white/10 p-4">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a message"
          className="focus-ring min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
        <button
          type="submit"
          disabled={sending}
          aria-label="Send message"
          className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-night transition hover:bg-aqua disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

export default memo(ChatBox);
