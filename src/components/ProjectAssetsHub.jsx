import { ExternalLink, FolderOpen, Link as LinkIcon, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { normalizeAssetLink, parseGoogleDriveLink, updateProjectDriveFolder } from '../services/api';

const categories = ['Brand assets', 'Raw images', 'Video and reels', 'Source files', 'References'];

export default function ProjectAssetsHub({ project, isAdmin = false, onChanged }) {
  const link = normalizeAssetLink(project.drive_folder_url);
  const hasDrive = Boolean(project.drive_folder_url && link.isValid);
  const [folderUrl, setFolderUrl] = useState(project.drive_folder_url || '');
  const [saving, setSaving] = useState(false);
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
    <section className="glass rounded-3xl p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-aqua/70">Project Assets Hub</p>
          <h3 className="mt-2 text-xl font-black">Google Drive source library</h3>
        </div>
        {hasDrive ? (
          <a href={link.viewUrl} target="_blank" rel="noreferrer" className="focus-ring flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-night transition hover:bg-aqua">
            <FolderOpen className="h-4 w-4" />
            Open Project Assets Folder
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span className="rounded-full border border-ember/25 bg-ember/10 px-3 py-1 text-xs font-black text-ember">Awaiting folder</span>
        )}
      </div>

      {isAdmin && (
        <div className="mb-4 grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[1fr_auto]">
          <input value={folderUrl} onChange={(event) => setFolderUrl(event.target.value)} placeholder="Paste Google Drive folder link" className="focus-ring min-w-0 rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35" />
          <button type="button" disabled={saving} onClick={saveFolder} className="focus-ring rounded-xl bg-white px-4 py-2 text-sm font-black text-night transition hover:bg-aqua disabled:opacity-50">
            {saving ? 'Saving' : 'Update folder'}
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <div key={category} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm font-black">{category}</p>
            <p className="mt-1 text-xs leading-5 text-white/42">Managed in Drive to keep heavy files organized outside portal storage.</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-aqua/15 bg-aqua/[0.055] p-4">
        <div className="flex gap-3">
          <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-aqua" />
          <p className="text-sm leading-6 text-white/68">
            Upload raw assets, reels, PSDs, references, and large media directly to the Drive folder. Keep only invoices, PDFs, and lightweight previews inside this portal.
          </p>
        </div>
        {(project.drive_folder_id || link.id) && (
          <p className="mt-3 flex items-center gap-2 text-xs font-bold text-white/38">
            <LinkIcon className="h-3.5 w-3.5" />
            Folder ID: {project.drive_folder_id || link.id}
          </p>
        )}
      </div>
    </section>
  );
}
