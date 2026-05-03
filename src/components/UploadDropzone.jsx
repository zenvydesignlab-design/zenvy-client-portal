import { Image, Paperclip, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { uploadFile, validateUploadFile } from '../services/api';

export default function UploadDropzone({ projectId, userId, onUploaded, compact = false }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const isImage = useMemo(() => file?.type?.startsWith('image/'), [file]);

  const chooseFile = (nextFile) => {
    if (!nextFile) return;
    try {
      validateUploadFile(nextFile);
      setFile(nextFile);
      setProgress(0);
      if (nextFile.type.startsWith('image/')) setPreview(URL.createObjectURL(nextFile));
      else setPreview('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, projectId, userId, setProgress);
      toast.success('File uploaded');
      setFile(null);
      setPreview('');
      setProgress(0);
      onUploaded?.(uploaded);
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        chooseFile(event.dataTransfer.files?.[0]);
      }}
      className={`rounded-3xl border border-dashed border-aqua/25 bg-aqua/[0.04] p-4 ${compact ? '' : 'sm:p-5'}`}
    >
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-center transition hover:border-aqua/35">
        <input
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <Paperclip className="mb-3 h-6 w-6 text-aqua" />
        <p className="text-sm font-black">Drop files or browse</p>
        <p className="mt-1 text-xs leading-5 text-white/42">PNG, JPG, WEBP under 1MB. PDF under 5MB.</p>
      </label>

      {file && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-night/60">
              {isImage && preview ? <img src={preview} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Image className="h-6 w-6 text-white/50" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{file.name}</p>
              <p className="mt-1 text-xs text-white/42">{Math.round(file.size / 1024)} KB</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-aqua transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button type="button" onClick={() => { setFile(null); setPreview(''); setProgress(0); }} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60">
              <X className="h-4 w-4" />
            </button>
          </div>
          <button type="button" disabled={uploading} onClick={handleUpload} className="focus-ring mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-night transition hover:bg-aqua disabled:opacity-50">
            {uploading ? 'Uploading' : 'Upload file'}
          </button>
        </div>
      )}
    </div>
  );
}
