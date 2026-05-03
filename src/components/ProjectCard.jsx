import { ArrowUpRight, Clock } from 'lucide-react';
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate } from '../services/api';
import ProgressBar from './ProgressBar';

const statusStyles = {
  'In Progress': 'border-aqua/25 bg-aqua/10 text-aqua',
  Review: 'border-violet/25 bg-violet/10 text-violet',
  Discovery: 'border-ember/25 bg-ember/10 text-ember',
  Complete: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
};

function ProjectCard({ project }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.28 }}
      className="group glass rounded-3xl p-5"
    >
      <Link to={`/projects/${project.id}`} className="block">
        <div className="mb-7 flex items-start justify-between gap-4">
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[project.status] || 'border-white/10 bg-white/10 text-white/70'}`}>
            {project.status}
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition group-hover:border-aqua/30 group-hover:text-aqua">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
        <h3 className="text-2xl font-black tracking-tight">{project.name}</h3>
        <p className="mt-3 min-h-12 text-sm leading-6 text-white/54">{project.description}</p>
        <div className="mt-7">
          <ProgressBar value={project.progress} />
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-white/42">
          <Clock className="h-4 w-4" />
          Updated {formatDate(project.updated_at)}
        </div>
      </Link>
    </motion.div>
  );
}

export default memo(ProjectCard);
