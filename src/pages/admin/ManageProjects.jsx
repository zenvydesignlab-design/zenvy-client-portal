import { ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import ProgressBar from '../../components/ProgressBar';
import StatusBadge from '../../components/StatusBadge';
import UploadDropzone from '../../components/UploadDropzone';
import { addProjectQuestion, formatDate, getUsers, parseGoogleDriveLink, saveProject } from '../../services/api';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';

const initialProject = {
  name: '',
  client_id: '',
  status: 'Discovery',
  progress: 10,
  description: '',
  deadline: '',
  drive_folder_url: '',
  drive_folder_id: '',
};

const defaultQuestion = { id: 'new_question', label: '', type: 'text', options: [] };

export default function ManageProjects() {
  const { user } = useAuth();
  const { projects, refresh } = useProjects();
  const [clients, setClients] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialProject);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialQuestions, setInitialQuestions] = useState([
    { id: 'brand_overview', label: 'Tell us about your brand', type: 'textarea', options: [] },
    { id: 'style', label: 'Preferred visual direction', type: 'dropdown', options: ['Premium minimal', 'Bold editorial', 'Clean SaaS'] },
    { id: 'assets', label: 'Upload logo or references', type: 'file', options: [] },
  ]);

  useEffect(() => {
    getUsers()
      .then((users) => setClients(users.filter((item) => item.role === 'client')))
      .catch((error) => toast.error(error.message || 'Unable to load clients'));
  }, []);

  const openCreate = () => {
    if (!clients.length) {
      toast.error('Create a client before adding a project');
      return;
    }
    setEditing(null);
    setForm({ ...initialProject, client_id: clients[0]?.id || '' });
    setModalOpen(true);
  };

  const updateQuestion = (index, patch) => {
    setInitialQuestions((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch, id: patch.label ? patch.label.toLowerCase().replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') : item.id } : item
    )));
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm(project);
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const drive = parseGoogleDriveLink(form.drive_folder_url);
    if (form.drive_folder_url && (!drive || drive.type !== 'folder')) {
      toast.error('Use a valid Google Drive folder link');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveProject({ ...form, drive_folder_id: form.drive_folder_id || drive?.id || '', progress: Number(form.progress), id: editing?.id });
      if (!editing) {
        const questionsToCreate = initialQuestions.filter((question) => question.label.trim());
        await Promise.all(questionsToCreate.map((question) => addProjectQuestion({
          projectId: saved.id,
          question: question.label,
          type: question.type,
          options: ['dropdown', 'multiple_choice'].includes(question.type) ? question.options : [],
        })));
      }
      toast.success(editing ? 'Project updated' : 'Project created');
      setEditing(null);
      setForm(initialProject);
      setModalOpen(false);
      refresh();
    } catch (error) {
      toast.error(error.message || 'Unable to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-aqua/75">Admin</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Manage projects</h2>
        </div>
        <button onClick={openCreate} className="focus-ring flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-night transition hover:bg-aqua" type="button">
          <Plus className="h-5 w-5" />
          New project
        </button>
      </section>

      {clients.length === 0 ? (
        <div className="glass rounded-3xl p-6">
          <h3 className="text-xl font-black">Create a client first</h3>
          <p className="mt-2 text-sm leading-6 text-white/50">Projects must be assigned to a client user. Once the create-client Edge Function is deployed, add a client and return here.</p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {projects.map((project) => (
          <article key={project.id} className="glass rounded-3xl p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">{project.name}</h3>
                <p className="mt-2 text-sm leading-6 text-white/48">{project.description}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <ProgressBar value={project.progress} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/36">Drive folder</p>
                <p className="mt-1 truncate text-sm font-bold text-white/70">{project.drive_folder_url ? 'Attached' : 'Not attached'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/36">Deadline</p>
                <p className="mt-1 text-sm font-bold text-white/70">{project.deadline || 'Not set'}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-white/42">Updated {formatDate(project.updated_at)}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(project)} className="focus-ring flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-night transition hover:bg-aqua">
                  <Save className="h-4 w-4" />
                  Edit
                </button>
                <Link to={`/admin/projects/${project.id}`} className="focus-ring flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-black text-white/70 transition hover:border-aqua/30 hover:text-white">
                  <ExternalLink className="h-4 w-4" />
                  Brief
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-white/38">Lightweight PDFs, invoices, and thumbnails only. Heavy assets belong in Google Drive.</p>
              <UploadDropzone projectId={project.id} userId={user.id} compact />
            </div>
          </article>
        ))}
      </div>

      <Modal open={modalOpen} title={editing ? 'Update project' : 'Create project'} onClose={() => { setEditing(null); setForm(initialProject); setModalOpen(false); }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required placeholder="Project name" className="focus-ring w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white placeholder:text-white/35" />
          <select value={form.client_id} onChange={(event) => setForm({ ...form, client_id: event.target.value })} required className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-white">
            <option value="">Assign client</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.email}</option>)}
          </select>
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-white">
            <option>Discovery</option>
            <option>Wireframing</option>
            <option>Design</option>
            <option>Development</option>
            <option>Review</option>
            <option>Delivered</option>
          </select>
          <input value={form.deadline || ''} onChange={(event) => setForm({ ...form, deadline: event.target.value })} type="date" className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-white" />
          <input value={form.drive_folder_url || ''} onChange={(event) => {
            const drive = parseGoogleDriveLink(event.target.value);
            setForm({ ...form, drive_folder_url: event.target.value, drive_folder_id: drive?.type === 'folder' ? drive.id : form.drive_folder_id });
          }} placeholder="Google Drive folder URL" className="focus-ring w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white placeholder:text-white/35" />
          <input value={form.drive_folder_id || ''} onChange={(event) => setForm({ ...form, drive_folder_id: event.target.value })} placeholder="Google Drive folder ID" className="focus-ring w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white placeholder:text-white/35" />
          <label className="block text-sm font-bold text-white/60">
            Progress: {form.progress}%
            <input type="range" min="0" max="100" value={form.progress} onChange={(event) => setForm({ ...form, progress: event.target.value })} className="mt-3 w-full accent-cyan-300" />
          </label>
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required rows="4" placeholder="Project description" className="focus-ring w-full resize-none rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white placeholder:text-white/35" />
          {!editing && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-aqua/70">Project brief</p>
                <p className="mt-1 text-sm text-white/45">These questions are created only for this project. Add follow-ups from the project brief later.</p>
              </div>
              <div className="space-y-3">
                {initialQuestions.map((question, index) => (
                  <div key={`${question.id}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-night/40 p-3 md:grid-cols-[1fr_9rem_1fr_2.5rem]">
                    <input value={question.label} onChange={(event) => updateQuestion(index, { label: event.target.value })} placeholder="Question" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white" />
                    <select value={question.type} onChange={(event) => updateQuestion(index, { type: event.target.value })} className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white">
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="multiple_choice">Multiple choice</option>
                      <option value="file">File reference/link</option>
                    </select>
                    <input value={(question.options || []).join(', ')} onChange={(event) => updateQuestion(index, { options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} disabled={!['dropdown', 'multiple_choice'].includes(question.type)} placeholder="Options" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white disabled:opacity-35" />
                    <button type="button" onClick={() => setInitialQuestions((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="grid h-10 w-10 place-items-center rounded-xl border border-ember/20 bg-ember/10 text-ember">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setInitialQuestions((items) => [...items, { ...defaultQuestion, id: `question_${items.length + 1}` }])} className="focus-ring mt-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/70">
                Add question
              </button>
            </div>
          )}
          <button
            disabled={saving}
            type="button"
            onClick={handleSubmit}
            className="focus-ring w-full rounded-2xl bg-white px-5 py-3 font-black text-night transition hover:bg-aqua disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing ? 'Save changes' : 'Create project'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
