import { toast } from 'react-hot-toast';
import { requireSupabase } from './supabaseClient';
export { validateUploadFile } from './uploadValidation';
import { validateUploadFile } from './uploadValidation';

const byUpdated = (a, b) => new Date(b.updated_at) - new Date(a.updated_at);
const byCreated = (a, b) => new Date(a.created_at) - new Date(b.created_at);

function safeFileName(name) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function getUsers() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*, projects:projects(count)')
    .order('email');
  if (error) throw error;
  return data;
}

export async function createClientUser(payload) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('create-client', {
    body: payload,
  });
  if (error) {
    let detail = error.message;
    if (error.context) {
      try {
        const body = await error.context.clone().json();
        detail = body.message || body.error || detail;
      } catch {
        try {
          detail = await error.context.clone().text();
        } catch {
          detail = error.message;
        }
      }
    }
    if (/failed to send a request to the edge function/i.test(detail)) {
      detail = 'create-client Edge Function is unavailable. Deploy it with Supabase CLI, then retry.';
    }
    throw new Error(detail);
  }
  return data;
}

export async function updateUserRole(profile) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('users').upsert(profile).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClientUser(userId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('delete-client', {
    body: { userId },
  });
  if (error) {
    let detail = error.message;
    if (error.context) {
      try {
        const body = await error.context.clone().json();
        detail = body.message || body.error || detail;
      } catch {
        detail = error.message;
      }
    }
    throw new Error(detail);
  }
  return data;
}

export async function getProjects(user) {
  const supabase = requireSupabase();
  let query = supabase.from('projects').select('*').order('updated_at', { ascending: false });
  if (user?.role !== 'admin') query = query.eq('client_id', user?.id);
  const { data, error } = await query;
  if (error) throw error;
  return data.sort(byUpdated);
}

export async function getProject(projectId, user) {
  const supabase = requireSupabase();
  let query = supabase.from('projects').select('*').eq('id', projectId);
  if (user?.role !== 'admin') query = query.eq('client_id', user?.id);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('This project either does not exist or is not assigned to your account.');
  return data;
}

export async function saveProject(payload) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('projects')
    .upsert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMessages(projectId, user) {
  const supabase = requireSupabase();
  let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
  if (projectId) query = query.eq('project_id', projectId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function sendMessage({ project_id, sender, text }) {
  if (!text.trim()) return null;
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('messages')
    .insert({ project_id, sender, text: text.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFiles(projectId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return Promise.all((data || []).map(async (file) => {
    if (!file.file_path) return file;
    const { data: signed } = await supabase.storage
      .from('project-files')
      .createSignedUrl(file.file_path, 60 * 10);
    return { ...file, file_url: signed?.signedUrl || file.file_url };
  }));
}

export async function uploadFile(file, projectId, userId, onProgress) {
  if (!file) return null;
  validateUploadFile(file);
  const supabase = requireSupabase();
  const filePath = `${projectId}/${userId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  onProgress?.(15);
  const upload = await supabase.storage.from('project-files').upload(filePath, file, { upsert: false });
  if (upload.error) throw upload.error;
  onProgress?.(75);
  const { data, error } = await supabase
    .from('files')
    .insert({ project_id: projectId, user_id: userId, file_url: filePath, file_path: filePath, name: file.name })
    .select()
    .single();
  if (error) throw error;
  const { data: signed } = await supabase.storage.from('project-files').createSignedUrl(filePath, 60 * 10);
  onProgress?.(100);
  return { ...data, file_url: signed?.signedUrl || data.file_url };
}

export async function uploadProjectFile({ projectId, file, userId, onProgress }) {
  return uploadFile(file, projectId, userId, onProgress);
}

export async function getProjectQuestions(projectId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('questions')
    .select('*, answers(*, users(email))')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addProjectQuestion({ projectId, question, type = 'textarea', options = [] }) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('questions')
    .insert({ project_id: projectId, question: question.trim(), type, options })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function answerProjectQuestion({ questionId, answer }) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('answers')
    .upsert({ question_id: questionId, answer, updated_at: new Date().toISOString() }, { onConflict: 'question_id,user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function formatDate(value) {
  if (!value) return 'Not updated yet';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
