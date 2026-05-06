import { Filter, Pencil, Plus, Search, Shield, Trash2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import { createClientUser, deleteClientUser, getUsers, updateClientProfile } from '../../services/api';

export default function ManageClients() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editRole, setEditRole] = useState('client');
  const [editStatus, setEditStatus] = useState('active');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      setUsers(await getUsers());
    } catch (error) {
      toast.error(error.message || 'Unable to load users');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (event) => {
    event?.preventDefault();
    setSaving(true);
    try {
      await createClientUser({ email, password, role });
      toast.success('Client account created');
      setEmail('');
      setPassword('');
      setRole('client');
      setOpen(false);
      load();
    } catch (error) {
      toast.error(error.message || 'Unable to create client');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (client) => {
    setEditing(client);
    setEditRole(client.role);
    setEditStatus(client.status || 'active');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateClientProfile({ id: editing.id, email: editing.email, role: editRole, status: editStatus });
      toast.success('Client updated');
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message || 'Unable to update client');
    } finally {
      setSaving(false);
    }
  };

  const visibleUsers = users.filter((item) => {
    const matchesQuery = item.email.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || (item.status || 'active') === filter || item.role === filter;
    return matchesQuery && matchesFilter;
  });

  const requestDelete = async (client) => {
    if (!window.confirm(`Delete ${client.email}? This removes the auth user and client profile.`)) return;
    setSaving(true);
    try {
      await deleteClientUser(client.id);
      toast.success('Client deleted');
      load();
    } catch (error) {
      toast.error(error.message || 'Unable to delete client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-aqua/75">Admin</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Manage clients</h2>
        </div>
        <button onClick={() => setOpen(true)} className="focus-ring flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-night transition hover:bg-aqua" type="button">
          <Plus className="h-5 w-5" />
          Add client
        </button>
      </section>

      <section className="glass grid gap-3 rounded-3xl p-4 md:grid-cols-[1fr_13rem]">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Search className="h-4 w-4 text-white/38" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by email" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35" />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Filter className="h-4 w-4 text-white/38" />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-w-0 flex-1 bg-night text-sm font-bold text-white outline-none">
            <option value="all">All users</option>
            <option value="client">Clients</option>
            <option value="admin">Admins</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </section>

      <div className="glass overflow-hidden rounded-3xl">
        <div className="grid grid-cols-[1fr_6rem_7rem_7rem_7rem] border-b border-white/10 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white/38 max-md:grid-cols-[1fr_5rem_5rem]">
          <span>User</span>
          <span className="max-md:hidden">Projects</span>
          <span>Role</span>
          <span className="max-md:hidden">Status</span>
          <span>Actions</span>
        </div>
        {visibleUsers.map((item) => (
          <div key={`${item.id}-${item.email}`} className="grid grid-cols-[1fr_6rem_7rem_7rem_7rem] items-center border-b border-white/8 px-5 py-4 last:border-0 max-md:grid-cols-[1fr_5rem_5rem]">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
                {item.role === 'admin' ? <Shield className="h-5 w-5 text-violet" /> : <UserRound className="h-5 w-5 text-aqua" />}
              </div>
              <span className="truncate font-bold">{item.email}</span>
            </div>
            <span className="text-sm font-bold text-white/50 max-md:hidden">{item.projects?.[0]?.count || 0}</span>
            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black capitalize text-white/60">{item.role}</span>
            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black capitalize max-md:hidden ${(item.status || 'active') === 'inactive' ? 'border-ember/25 bg-ember/10 text-ember' : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'}`}>{item.status || 'active'}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(item)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60">
                <Pencil className="h-4 w-4" />
              </button>
              {item.role === 'client' && (
                <button type="button" onClick={() => requestDelete(item)} className="grid h-9 w-9 place-items-center rounded-xl border border-ember/20 bg-ember/10 text-ember">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} title="Add client" onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" placeholder="client@company.com" className="focus-ring w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white placeholder:text-white/35" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" type="password" placeholder="Temporary password" className="focus-ring w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white placeholder:text-white/35" />
          <select value={role} onChange={(event) => setRole(event.target.value)} className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-white">
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
          <button
            disabled={saving}
            type="button"
            onClick={handleSubmit}
            className="focus-ring w-full rounded-2xl bg-white px-5 py-3 font-black text-night transition hover:bg-aqua disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Creating account' : 'Create account'}
          </button>
        </form>
      </Modal>
      <Modal open={Boolean(editing)} title="Edit client" onClose={() => setEditing(null)}>
        <div className="space-y-4">
          <p className="truncate text-sm font-bold text-white/65">{editing?.email}</p>
          <select value={editRole} onChange={(event) => setEditRole(event.target.value)} className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-white">
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
          <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-white">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button disabled={saving} type="button" onClick={saveEdit} className="focus-ring w-full rounded-2xl bg-white px-5 py-3 font-black text-night transition hover:bg-aqua disabled:opacity-50">
            Save changes
          </button>
        </div>
      </Modal>
    </div>
  );
}
