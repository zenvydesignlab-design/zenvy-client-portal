import { ArrowUpRight, Clock } from 'lucide-react';
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate } from '../services/api';
import ProgressBar from './ProgressBar';

const statusStyles = {
  Wireframing: 'border-aqua/20 bg-aqua/5 text-aqua',
  Design: 'border-violet/20 bg-violet/5 text-violet',
  Development: 'border-aqua/20 bg-aqua/5 text-aqua',
  Review: 'border-violet/20 bg-violet/5 text-violet',
  Discovery: 'border-ember/20 bg-ember/5 text-ember',
  Delivered: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  Complete: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
};

function ProjectCard({ project }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
    >
      <Link to={`/projects/${project.id}`} className="flex flex-1 flex-col">
        <div className="mb-6 flex items-start justify-between">
          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusStyles[project.status] || 'border-white/10 bg-white/5 text-slate-400'}`}>
            {project.status}
          </span>
          <ArrowUpRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-aqua" />
        </div>
        
        <h3 className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-aqua">{project.name}</h3>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{project.description}</p>
        
        <div className="mt-auto pt-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Progress</span>
            <span className="text-[10px] font-bold text-white">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} />
        </div>
        
        <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          <Clock className="h-3 w-3" />
          Updated {formatDate(project.updated_at)}
        </div>
      </Link>
    </motion.div>
  );
}

export default memo(ProjectCard);
