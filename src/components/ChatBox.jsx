import { Loader2, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { sendMessage, formatDate, subscribeToProjectMessages } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function ChatBox({ projectId, messages, onSent, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState(messages);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);
  const { user } = useAuth();
  
  const groupedMessages = useMemo(() => localMessages.map((message, index) => {
    const previous = localMessages[index - 1];
    const sameSender = previous?.sender === message.sender;
    const previousTime = previous?.created_at ? new Date(previous.created_at).getTime() : 0;
    const currentTime = message.created_at ? new Date(message.created_at).getTime() : 0;
    return {
      ...message,
      grouped: sameSender && currentTime - previousTime < 5 * 60 * 1000,
    };
  }), [localMessages]);

  useEffect(() => setLocalMessages(messages), [messages]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [groupedMessages, typing, isOpen]);

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
    typingTimeout.current = setTimeout(() => setTyping(false), 1000);
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
    <div className={`flex flex-col rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden transition-all duration-300 ${isOpen ? (compact ? 'h-[32rem]' : 'h-[36rem]') : 'h-auto'}`}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="h-4 w-4 text-aqua" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Project Chat</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-md bg-aqua/10 px-2 py-0.5 border border-aqua/20">
            <span className="h-1 w-1 rounded-full bg-aqua animate-pulse" />
            <span className="text-[10px] font-bold text-aqua uppercase tracking-widest">{localMessages.length} msgs</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="h-[1px] w-full bg-white/5" />
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
            {localMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">No messages yet</p>
              </div>
            ) : (
              groupedMessages.map((message, idx) => {
                const mine = message.sender === user.role;
                return (
                  <div key={message.id || idx} className={`flex flex-col ${mine ? 'items-end' : 'items-start'} ${message.grouped ? 'mt-1' : 'mt-4'}`}>
                    {!message.grouped && (
                      <span className="mb-1.5 px-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {mine ? 'You' : message.sender}
                      </span>
                    )}
                    <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${mine ? 'bg-white text-night' : 'border border-white/5 bg-white/[0.03] text-white'}`}>
                      {message.text}
                    </div>
                    {!message.grouped && (
                      <span className="mt-1.5 px-1 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                        {formatDate(message.created_at)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
            {typing && (
              <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-1.5 w-fit">
                <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Drafting...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/5 bg-white/[0.02] p-4">
            <div className="relative flex items-center gap-2">
              <input
                value={text}
                onChange={handleTextChange}
                placeholder="Write a message..."
                className="w-full rounded-lg bg-night border border-white/10 pl-4 pr-12 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-aqua/50"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-md bg-white text-night transition-all hover:bg-aqua disabled:opacity-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default memo(ChatBox);
