import { ExternalLink, FileText, FolderOpen, Grid, Image as ImageIcon, List, Search, Trash2, UploadCloud } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { normalizeAssetLink, parseGoogleDriveLink, updateProjectDriveFolder, deleteFileRecord, bulkDeleteFiles } from '../services/api';

const fileLabel = (file) => file.name || file.file_url?.split('/').pop() || 'Untitled asset';

export default function ProjectAssetsHub({ project, files = [], isAdmin = false, onChanged }) {
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [folderUrl, setFolderUrl] = useState(project.drive_folder_url || '');
  const [saving, setSaving] = useState(false);

  const driveLink = normalizeAssetLink(project.drive_folder_url);
  
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const name = fileLabel(file);
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || 
        (filter === 'images' && name.match(/\.(jpg|jpeg|png|webp|gif)$/i)) ||
        (filter === 'pdfs' && name.match(/\.pdf$/i));
      return matchesSearch && matchesFilter;
    });
  }, [files, search, filter]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete ${fileLabel(file)}?`)) return;
    try {
      await deleteFileRecord(file);
      toast.success('File deleted');
      onChanged?.();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} files?`)) return;
    try {
      const toDelete = files.filter(f => selected.includes(f.id));
      await bulkDeleteFiles(toDelete);
      toast.success('Files deleted');
      setSelected([]);
      onChanged?.();
    } catch (error) {
      toast.error('Failed to delete files');
    }
  };

  const saveFolder = async () => {
    const parsed = parseGoogleDriveLink(folderUrl);
    if (folderUrl && (!parsed || parsed.type !== 'folder')) {
      toast.error('Paste a valid Google Drive folder link');
      return;
    }
    setSaving(true);
    try {
      await updateProjectDriveFolder(project.id, { drive_folder_url: parsed?.viewUrl || '', drive_folder_id: parsed?.id || '' });
      toast.success('Drive folder updated');
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Unable to update Drive folder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-aqua" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Asset Management</p>
          </div>
          <h3 className="text-xl font-bold text-white">Project Assets</h3>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && isAdmin && (
            <button 
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selected.length}
            </button>
          )}
          {driveLink.isValid && (
            <a href={driveLink.viewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/5 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/10 transition-all">
              <FolderOpen className="h-3.5 w-3.5" />
              Open Drive
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-1 rounded-md bg-white/[0.03] p-1">
          {['all', 'images', 'pdfs'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${filter === t ? 'bg-white text-night' : 'text-slate-500 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full rounded-lg bg-white/[0.03] border border-white/5 pl-9 pr-4 py-1.5 text-xs text-white focus:border-aqua/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-md bg-white/[0.03] p-1">
          <button type="button" onClick={() => setView('grid')} className={`p-1 rounded transition-all ${view === 'grid' ? 'bg-white text-night' : 'text-slate-500 hover:text-white'}`}>
            <Grid className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setView('list')} className={`p-1 rounded transition-all ${view === 'list' ? 'bg-white text-night' : 'text-slate-500 hover:text-white'}`}>
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UploadCloud className="h-10 w-10 text-slate-700 mb-4" />
          <p className="text-xs text-slate-600">No assets found matching your criteria.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => {
            const name = fileLabel(file);
            const isImageFile = name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
            return (
              <div 
                key={file.id} 
                className={`group relative flex flex-col rounded-xl border transition-all overflow-hidden ${selected.includes(file.id) ? 'border-aqua bg-aqua/5' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}
              >
                {isAdmin && (
                  <div className="absolute top-2 left-2 z-10">
                    <input 
                      type="checkbox" 
                      checked={selected.includes(file.id)}
                      onChange={() => toggleSelect(file.id)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/10 text-aqua focus:ring-aqua"
                    />
                  </div>
                )}
                
                <div className="aspect-video w-full bg-night/50 flex items-center justify-center overflow-hidden border-b border-white/5">
                  {isImageFile ? (
                    <img src={file.file_url} alt={name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <FileText className="h-10 w-10 text-slate-800" />
                  )}
                </div>
                
                <div className="p-3">
                  <p className="truncate text-xs font-bold text-white">{name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{new Date(file.uploaded_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={file.file_url} target="_blank" rel="noreferrer" className="p-1 text-slate-500 hover:text-white transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {isAdmin && (
                        <button type="button" onClick={() => handleDelete(file)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredFiles.map((file) => {
            const name = fileLabel(file);
            const isImageFile = name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
            return (
              <div 
                key={file.id} 
                className={`group flex items-center justify-between gap-4 p-2 rounded-lg border transition-all ${selected.includes(file.id) ? 'border-aqua bg-aqua/5' : 'border-transparent hover:bg-white/[0.03]'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isAdmin && (
                    <input 
                      type="checkbox" 
                      checked={selected.includes(file.id)}
                      onChange={() => toggleSelect(file.id)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/10 text-aqua focus:ring-aqua"
                    />
                  )}
                  <div className="h-8 w-8 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                    {isImageFile ? <ImageIcon className="h-3.5 w-3.5 text-aqua" /> : <FileText className="h-3.5 w-3.5 text-violet" />}
                  </div>
                  <p className="truncate text-[11px] font-bold text-white">{name}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="hidden sm:block text-[10px] font-bold text-slate-600 uppercase tracking-widest">{new Date(file.uploaded_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <a href={file.file_url} target="_blank" rel="noreferrer" className="p-1 text-slate-500 hover:text-white transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {isAdmin && (
                      <button type="button" onClick={() => handleDelete(file)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <div className="mt-10 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="h-3.5 w-3.5 text-aqua" />
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Drive Sync Configuration</h4>
          </div>
          <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
            Connect a Google Drive folder for large assets (Reels, RAW footage, PSDs).
          </p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input 
              value={folderUrl} 
              onChange={(e) => setFolderUrl(e.target.value)} 
              placeholder="Paste Google Drive folder link" 
              className="w-full rounded-lg bg-night border border-white/10 px-4 py-2 text-xs text-white focus:border-aqua/50 outline-none" 
            />
            <button 
              disabled={saving} 
              type="button"
              onClick={saveFolder} 
              className="rounded-lg bg-white px-5 py-2 text-xs font-bold text-night hover:bg-aqua transition-colors disabled:opacity-50"
            >
              {saving ? 'Syncing...' : 'Update Sync'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
