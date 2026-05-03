import { motion } from 'framer-motion';

export default function Loader({ fullScreen = false, label = 'Loading' }) {
  return (
    <div className={fullScreen ? 'app-shell grid min-h-screen place-items-center' : 'grid min-h-48 place-items-center'}>
      <div className="relative z-10 flex flex-col items-center gap-4 text-white/70">
        <motion.div
          className="h-14 w-14 rounded-full border border-aqua/20 border-t-aqua"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        />
        <span className="text-sm font-semibold tracking-[0.24em] uppercase">{label}</span>
      </div>
    </div>
  );
}
