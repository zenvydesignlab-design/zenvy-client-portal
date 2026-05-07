import { toast } from 'react-hot-toast';
import { requireSupabase } from './supabaseClient';
export { validateUploadFile } from './uploadValidation';
import { validateUploadFile } from './uploadValidation';
export {
  isGoogleDriveUrl,
  isValidExternalUrl,
  normalizeAssetLink,
  openAssetLink,
  parseGoogleDriveLink,
} from './linkUtils';
import { normalizeAssetLink, parseGoogleDriveLink } from './linkUtils';

const byUpdated = (a, b) => new Date(b.updated_at) - new Date(a.updated_at);
const byCreated = (a, b) => new Date(a.created_at) - new Date(b.created_at);
const relationMissingPattern = /does not exist|schema cache|Could not find the table|Could not find.*column/i;

async function optionalQuery(run, fallback = []) {
  try {
    return await run();
  } catch (error) {
    if (relationMissingPattern.test(error.message || '')) return fallback;
    throw error;
  }
}

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

export async function updateClientProfile(profile) {
  const supabase = requireSupabase();
  return optionalQuery(async () => {
    const { data, error } = await supabase.from('users').upsert(profile).select().single();
    if (error) throw error;
    return data;
  }, profile);
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
  const drive = parseGoogleDriveLink(payload.drive_folder_url);
  const normalized = {
    ...payload,
    drive_folder_url: payload.drive_folder_url?.trim() || null,
    drive_folder_id: payload.drive_folder_id?.trim() || drive?.id || null,
  };
  const { data, error } = await supabase
    .from('projects')
    .upsert({ ...normalized, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectDriveFolder(projectId, { drive_folder_url, drive_folder_id }) {
  const supabase = requireSupabase();
  const drive = parseGoogleDriveLink(drive_folder_url);
  const { data, error } = await supabase
    .from('projects')
    .update({
      drive_folder_url: drive_folder_url?.trim() || null,
      drive_folder_id: drive_folder_id?.trim() || drive?.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMessages(projectId, user) {
  const supabase = requireSupabase();
  let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
  if (projectId) query = query.eq('project_id', projectId);
  if (!projectId && user?.role !== 'admin') {
    const projects = await getProjects(user);
    const projectIds = projects.map((project) => project.id);
    if (!projectIds.length) return [];
    query = query.in('project_id', projectIds);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export function subscribeToProjectMessages(projectId, onMessage) {
  if (!projectId) return () => {};
  const supabase = requireSupabase();
  const channel = supabase
    .channel(`messages:${projectId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` },
      (payload) => onMessage(payload.new),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
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

export async function uploadContractPdf({ projectId, file, userId, onProgress }) {
  if (!file) return null;
  validateUploadFile(file);
  const supabase = requireSupabase();
  const filePath = `${projectId}/contracts/${userId || 'admin'}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  onProgress?.(15);
  const upload = await supabase.storage.from('project-files').upload(filePath, file, {
    contentType: file.type || 'application/pdf',
    upsert: false,
  });
  if (upload.error) throw upload.error;
  onProgress?.(80);
  const { data } = supabase.storage.from('project-files').getPublicUrl(filePath);
  onProgress?.(100);
  return data?.publicUrl || filePath;
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

export async function updateProjectQuestion({ questionId, question, type = 'textarea', options = [] }) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('questions')
    .update({ question: question.trim(), type, options })
    .eq('id', questionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectQuestion(questionId) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('questions').delete().eq('id', questionId);
  if (error) throw error;
  return true;
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

export async function getInvoices(projectId) {
  const supabase = requireSupabase();
  return optionalQuery(async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  });
}

export async function saveInvoice(payload, user) {
  const supabase = requireSupabase();
  const lineItems = Array.isArray(payload.line_items) ? payload.line_items : [];
  const subtotal = Number(payload.subtotal ?? lineItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0));
  const taxRate = Number(payload.tax_rate || 0);
  const tax = Number(payload.tax ?? subtotal * (taxRate / 100));
  const total = Number(payload.total ?? payload.amount ?? subtotal + tax);
  const normalized = {
    id: payload.id,
    project_id: payload.project_id,
    amount: total,
    subtotal,
    tax,
    total,
    currency: payload.currency || 'INR',
    status: ['paid', 'pending', 'overdue', 'void'].includes(payload.status) ? payload.status : 'pending',
    invoice_number: payload.invoice_number?.trim() || `INV-${Date.now()}`,
    title: payload.title?.trim() || payload.invoice_number?.trim() || 'Invoice',
    description: payload.description?.trim() || null,
    pdf_url: payload.pdf_url?.trim() || null,
    payment_terms: payload.payment_terms?.trim() || null,
    notes: payload.notes?.trim() || null,
    due_date: payload.due_date || null,
    line_items: lineItems,
    tax_rate: taxRate,
    client_name: payload.client_name?.trim() || null,
    client_email: payload.client_email?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (!normalized.id) {
    normalized.created_by = user?.id;
    delete normalized.id;
  }
  const { data, error } = await supabase.from('invoices').upsert(normalized).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInvoice(invoiceId) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
  if (error) throw error;
  return true;
}

export function isValidInvoiceUrl(value) {
  return !value || normalizeAssetLink(value).isValid;
}

export function getInvoiceViewUrl(value) {
  return normalizeAssetLink(value).viewUrl;
}

export function getInvoiceDownloadUrl(value) {
  return normalizeAssetLink(value).downloadUrl;
}

export async function getContracts(projectId) {
  const supabase = requireSupabase();
  return optionalQuery(async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  });
}

export async function saveContract(payload, user) {
  const supabase = requireSupabase();
  const pdfUrl = payload.pdf_url?.trim() || payload.contract_url?.trim() || null;
  const approved = payload.status === 'approved' || payload.signed === true;
  const normalized = {
    id: payload.id,
    project_id: payload.project_id,
    title: payload.title?.trim() || 'Project Agreement',
    pdf_url: pdfUrl,
    project_scope: payload.project_scope?.trim() || payload.scope?.trim() || null,
    deliverables: Array.isArray(payload.deliverables) ? payload.deliverables.filter(Boolean) : [],
    timeline: payload.timeline?.trim() || payload.timelines?.trim() || null,
    payment_terms: payload.payment_terms?.trim() || null,
    revisions: payload.revisions?.trim() || payload.revision_limits?.trim() || null,
    ownership_clause: payload.ownership_clause?.trim() || payload.ownership_terms?.trim() || null,
    cancellation_clause: payload.cancellation_clause?.trim() || payload.cancellation_terms?.trim() || null,
    notes: payload.notes?.trim() || null,
    status: ['draft', 'sent', 'approved', 'archived'].includes(payload.status) ? payload.status : 'draft',
    signed: approved,
    signed_by: payload.signed_by?.trim() || null,
    signed_email: payload.signed_email?.trim() || null,
    signed_at: approved ? (payload.signed_at || new Date().toISOString()) : null,
    signature_ip: payload.signature_ip || null,
    agreement_version: payload.agreement_version || 'v1.0',
    client_name: payload.client_name?.trim() || null,
    client_email: payload.client_email?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (!normalized.id) {
    normalized.created_by = user?.id;
    delete normalized.id;
  }
  const { data, error } = await supabase.from('contracts').upsert(normalized).select().single();
  if (error) throw error;
  return data;
}

export async function signContract({ contractId, signerName, signerEmail }) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc('sign_contract', {
    contract_id: contractId,
    signer_name: signerName,
    signer_email: signerEmail,
  });
  if (error) throw error;
  return data;
}

export async function deleteContract(contractId) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('contracts').delete().eq('id', contractId);
  if (error) throw error;
  return true;
}

export async function deleteFileRecord(file) {
  const supabase = requireSupabase();
  if (file.file_path) {
    await supabase.storage.from('project-files').remove([file.file_path]);
  }
  const { error } = await supabase.from('files').delete().eq('id', file.id);
  if (error) throw error;
  return true;
}

export async function bulkDeleteFiles(files) {
  const supabase = requireSupabase();
  const paths = files.map((f) => f.file_path).filter(Boolean);
  const ids = files.map((f) => f.id);
  if (paths.length) {
    await supabase.storage.from('project-files').remove(paths);
  }
  const { error } = await supabase.from('files').delete().in('id', ids);
  if (error) throw error;
  return true;
}

function matchesTerm(values, term) {
  const query = term.trim().toLowerCase();
  return values.some((value) => String(value || '').toLowerCase().includes(query));
}

function result(type, title, description, href, date) {
  return { id: `${type}-${href}-${title}`, type, title, description, href, date };
}

export async function globalSearch(user, term) {
  const query = term.trim();
  if (query.length < 2) return [];
  const supabase = requireSupabase();
  const isAdmin = user?.role === 'admin';
  const projects = await getProjects(user);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const projectIds = projects.map((project) => project.id);
  if (user?.role !== 'admin' && !projectIds.length) return [];

  const output = isAdmin
    ? projects
      .filter((project) => matchesTerm([project.name, project.description, project.status], query))
      .map((project) => result('project', project.name, project.status, `/admin/projects/${project.id}`, project.updated_at))
    : [];

  const scoped = (table) => {
    let request = supabase.from(table).select('*').limit(60);
    if (!isAdmin) request = request.in('project_id', projectIds);
    return request;
  };

  const [users, invoices, files, messages, approvals, questions, contracts, questionnaireTemplates, questionnaireResponses] = await Promise.all([
    isAdmin
      ? optionalQuery(async () => {
        const { data, error } = await supabase.from('users').select('id,email,role,status').limit(80);
        if (error) throw error;
        return data || [];
      })
      : [],
    isAdmin
      ? optionalQuery(async () => {
        const { data, error } = await scoped('invoices');
        if (error) throw error;
        return data || [];
      })
      : [],
    optionalQuery(async () => {
      const { data, error } = await scoped('files');
      if (error) throw error;
      return data || [];
    }),
    isAdmin
      ? optionalQuery(async () => {
      const { data, error } = await scoped('messages');
      if (error) throw error;
      return data || [];
      })
      : [],
    isAdmin
      ? optionalQuery(async () => {
      const { data, error } = await scoped('approvals');
      if (error) throw error;
      return data || [];
      })
      : [],
    optionalQuery(async () => {
      const { data, error } = await scoped('questions');
      if (error) throw error;
      return data || [];
    }),
    isAdmin
      ? optionalQuery(async () => {
        const { data, error } = await scoped('contracts');
        if (error) throw error;
        return data || [];
      })
      : [],
    isAdmin
      ? optionalQuery(async () => {
        const { data, error } = await scoped('questionnaire_templates');
        if (error) throw error;
        return data || [];
      })
      : [],
    isAdmin
      ? optionalQuery(async () => {
        const { data, error } = await scoped('questionnaire_responses');
        if (error) throw error;
        return data || [];
      })
      : [],
  ]);

  if (isAdmin) {
    users
      .filter((client) => matchesTerm([client.email, client.role, client.status], query))
      .forEach((client) => output.push(result('client', client.email, client.role, '/admin/clients', client.created_at)));
  }

  const projectHref = (projectId) => isAdmin ? `/admin/projects/${projectId}` : `/projects/${projectId}`;
  invoices
    .filter((invoice) => matchesTerm([invoice.invoice_number, invoice.title, invoice.status, invoice.notes, projectById.get(invoice.project_id)?.name], query))
    .forEach((invoice) => output.push(result('invoice', invoice.invoice_number || invoice.title, projectById.get(invoice.project_id)?.name || 'Invoice', projectHref(invoice.project_id), invoice.created_at)));
  files
    .filter((file) => matchesTerm([file.name, file.file_url, projectById.get(file.project_id)?.name], query))
    .forEach((file) => output.push(result('file', file.name || 'Project file', projectById.get(file.project_id)?.name || 'File', projectHref(file.project_id), file.uploaded_at)));
  if (isAdmin) {
    messages
      .filter((message) => matchesTerm([message.text, message.sender, projectById.get(message.project_id)?.name], query))
      .forEach((message) => output.push(result('message', message.text, `${message.sender} message`, projectHref(message.project_id), message.created_at)));
  }
  if (isAdmin) {
    approvals
      .filter((approval) => matchesTerm([approval.title, approval.description, approval.status, approval.feedback, projectById.get(approval.project_id)?.name], query))
      .forEach((approval) => output.push(result('approval', approval.title, approval.status, projectHref(approval.project_id), approval.created_at)));
  }
  if (isAdmin) {
    questions
      .filter((question) => matchesTerm([question.question, question.type, projectById.get(question.project_id)?.name], query))
      .forEach((question) => output.push(result('questionnaire', question.question, projectById.get(question.project_id)?.name || 'Questionnaire', projectHref(question.project_id), question.created_at)));
  } else {
    questions
      .filter((question) => matchesTerm([question.question, question.type], query))
      .forEach((question) => output.push(result('deliverable', question.question, projectById.get(question.project_id)?.name || 'Project questionnaire', projectHref(question.project_id), question.created_at)));
  }
  contracts
    .filter((contract) => matchesTerm([contract.title, contract.contract_url, contract.scope, contract.payment_terms, projectById.get(contract.project_id)?.name], query))
    .forEach((contract) => output.push(result('contract', contract.title, projectById.get(contract.project_id)?.name || 'Contract', projectHref(contract.project_id), contract.created_at)));
  questionnaireTemplates
    .filter((template) => matchesTerm([template.name, JSON.stringify(template.questions || []), projectById.get(template.project_id)?.name], query))
    .forEach((template) => output.push(result('questionnaire', template.name, projectById.get(template.project_id)?.name || 'Questionnaire template', template.project_id ? projectHref(template.project_id) : '/admin/projects', template.updated_at || template.created_at)));
  questionnaireResponses
    .filter((response) => matchesTerm([JSON.stringify(response.answers || {}), response.submitted ? 'submitted' : 'draft', projectById.get(response.project_id)?.name], query))
    .forEach((response) => output.push(result('questionnaire', response.submitted ? 'Submitted questionnaire' : 'Questionnaire draft', projectById.get(response.project_id)?.name || 'Questionnaire response', projectHref(response.project_id), response.updated_at || response.created_at)));

  return output
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 12);
}

export function deriveInvoiceStatus(invoice) {
  if (invoice.status === 'void') return 'void';
  if (invoice.status === 'paid') return 'paid';
  if (invoice.status === 'overdue') return 'overdue';
  if (invoice.due_date && new Date(invoice.due_date) < new Date(new Date().toDateString())) return 'overdue';
  return 'pending';
}

export function formatCurrency(value, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export async function getMeetings(projectId) {
  const supabase = requireSupabase();
  return optionalQuery(async () => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('project_id', projectId)
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return data || [];
  });
}

export async function saveMeeting(payload) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('meetings').upsert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function getApprovals(projectId) {
  const supabase = requireSupabase();
  return optionalQuery(async () => {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  });
}

export async function saveApproval(payload) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('approvals').upsert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function respondToApproval({ approvalId, status, feedback }) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('approvals')
    .update({ status, feedback, responded_at: new Date().toISOString() })
    .eq('id', approvalId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNotifications(user) {
  const supabase = requireSupabase();
  return optionalQuery(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},audience.eq.${user.role}`)
      .order('created_at', { ascending: false })
      .limit(8);
    if (error) throw error;
    return data || [];
  });
}

export async function markNotificationRead(notificationId) {
  const supabase = requireSupabase();
  return optionalQuery(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, null);
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

export function formatShortDate(value) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
