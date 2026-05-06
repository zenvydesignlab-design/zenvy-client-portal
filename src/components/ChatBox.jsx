import { Loader2, Send } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { sendMessage, formatDate, subscribeToProjectMessages } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function ChatBox({ projectId, messages, onSent }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState(messages);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);
  const { user } = useAuth();

  useEffect(() => setLocalMessages(messages), [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [localMessages, typing]);

  useEffect(() => {
    if (!projectId) return undefined;
    try {
      return subscribeToProjectMessages(projectId, (message) => {
        setLocalMessages((current) => (
          current.some((item) => item.id === message.id) ? current : [...current, message]
        ));
      });
    } catch {
      return undefined;
    }
  }, [projectId]);

  const handleTextChange = (event) => {
    setText(event.target.value);
    setTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping(false), 900);
  };

  useEffect(() => () => clearTimeout(typingTimeout.current), []);


  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage({ project_id: projectId, sender: user.role, text });
      setText('');
      setTyping(false);
      onSent?.();
    } catch (error) {
      toast.error(error.message || 'Message failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass sticky top-24 flex h-[calc(100vh-8rem)] min-h-[34rem] flex-col rounded-3xl max-xl:static max-xl:h-[36rem]">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Conversation</h2>
            <p className="mt-1 text-xs font-bold text-white/42">{localMessages.length} messages</p>
          </div>
          <span className="rounded-full border border-aqua/20 bg-aqua/10 px-3 py-1 text-xs font-black text-aqua">Live</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {localMessages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-white/45">
            <p>No messages yet.</p>
          </div>
        ) : (
          localMessages.map((message) => {
            const mine = message.sender === user.role;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-sm ${mine ? 'bg-aqua text-night' : 'border border-white/10 bg-white/8 text-white'}`}>
                  <p className={`mb-1 text-[11px] font-black uppercase tracking-[0.16em] ${mine ? 'text-night/55' : 'text-white/36'}`}>{mine ? 'You' : message.sender}</p>
                  <p className="text-sm font-semibold leading-6">{message.text}</p>
                  <p className={`mt-2 text-[11px] font-bold ${mine ? 'text-night/55' : 'text-white/38'}`}>{formatDate(message.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        {typing && (
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold text-white/45">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Drafting
            </span>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3 border-t border-white/10 p-4">
        <input
          value={text}
          onChange={handleTextChange}
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
