import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, supabaseConfigError } from '../services/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const profile = await signIn({ email, password });
      navigate(profile.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell grid min-h-screen place-items-center px-4 py-8">
      <div className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_27rem]">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[36rem] flex-col justify-center">
          <div className="mb-8 inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-black uppercase tracking-[0.28em] text-white/72">
            <Sparkles className="h-4 w-4 text-aqua" />
            Zenvy Client Portal
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-white sm:text-7xl lg:text-8xl">
            Delivery that feels as polished as the pitch.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/58">
            Secure project rooms, files, progress, and conversations for premium client work.
          </p>
          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            {['Secure auth', 'Project clarity', 'Live updates'].map((item) => (
              <div key={item} className="glass rounded-3xl p-4 text-sm font-bold text-white/75">{item}</div>
            ))}
          </div>
        </motion.section>

        <motion.form initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} onSubmit={handleSubmit} className="glass-strong self-center rounded-[2rem] p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-xl font-black text-night">Z</div>
            <div>
              <p className="text-2xl font-black tracking-[0.16em]">ZENVY</p>
              <p className="text-xs font-bold tracking-[0.38em] text-white/45">DESIGN LAB</p>
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-white/48">
            {isSupabaseConfigured ? 'Use your Supabase Auth credentials.' : supabaseConfigError}
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-5 rounded-2xl border border-ember/25 bg-ember/10 p-4 text-sm font-bold leading-6 text-ember">
              Real Supabase mode is required. Create a .env file from .env.example and restart the dev server.
            </div>
          )}

          <label className="mt-6 block text-sm font-bold text-white/70">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="focus-ring mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white placeholder:text-white/35"
            />
          </label>
          <label className="mt-4 block text-sm font-bold text-white/70">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="focus-ring mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white placeholder:text-white/35"
            />
          </label>
          <button disabled={submitting || !isSupabaseConfigured} type="submit" className="focus-ring mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 font-black text-night transition hover:bg-aqua disabled:cursor-not-allowed disabled:opacity-50">
            <ShieldCheck className="h-5 w-5" />
            Enter portal
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.form>
      </div>
    </div>
  );
}
