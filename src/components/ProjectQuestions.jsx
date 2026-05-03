import { MessageSquarePlus, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { addProjectQuestion, answerProjectQuestion, formatDate, getProjectQuestions } from '../services/api';
import UploadDropzone from './UploadDropzone';

export default function ProjectQuestions({ projectId, user }) {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newType, setNewType] = useState('textarea');
  const [newOptions, setNewOptions] = useState('');
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjectQuestions(projectId);
      setQuestions(data);
      setDrafts(Object.fromEntries(data.map((question) => {
        const ownAnswer = question.answers?.find((answer) => answer.user_id === user.id);
        return [question.id, ownAnswer?.answer || ''];
      })));
    } catch (error) {
      toast.error(error.message || 'Unable to load questions');
    } finally {
      setLoading(false);
    }
  }, [projectId, user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const unanswered = useMemo(
    () => questions.filter((question) => !(question.answers || []).some((answer) => answer.user_id === user.id)).length,
    [questions, user.id],
  );

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSaving(true);
    try {
      await addProjectQuestion({
        projectId,
        question: newQuestion,
        type: newType,
        options: newType === 'dropdown' ? newOptions.split(',').map((option) => option.trim()).filter(Boolean) : [],
      });
      toast.success('Question added');
      setNewQuestion('');
      setNewOptions('');
      load();
    } catch (error) {
      toast.error(error.message || 'Unable to add question');
    } finally {
      setSaving(false);
    }
  };

  const handleAnswer = async (questionId) => {
    const answer = drafts[questionId]?.trim();
    if (!answer) return;
    setSaving(true);
    try {
      await answerProjectQuestion({ questionId, answer });
      toast.success('Answer saved');
      load();
    } catch (error) {
      toast.error(error.message || 'Unable to save answer');
    } finally {
      setSaving(false);
    }
  };

  const handleFileAnswer = async (questionId, uploaded) => {
    const answer = `${uploaded.name || 'Uploaded file'} (${uploaded.file_path || uploaded.file_url})`;
    setDrafts((current) => ({ ...current, [questionId]: answer }));
    setSaving(true);
    try {
      await answerProjectQuestion({ questionId, answer });
      toast.success('File answer saved');
      load();
    } catch (error) {
      toast.error(error.message || 'Unable to save file answer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-aqua/70">Project questions</p>
          <h3 className="mt-2 text-xl font-black">Iterative brief</h3>
        </div>
        {!isAdmin && <span className="rounded-full border border-aqua/20 bg-aqua/10 px-3 py-1 text-xs font-black text-aqua">{unanswered} open</span>}
      </div>

      {isAdmin && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <textarea value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} rows="3" placeholder="Ask a project-specific question or follow-up" className="focus-ring w-full resize-none rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white placeholder:text-white/35" />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select value={newType} onChange={(event) => setNewType(event.target.value)} className="focus-ring rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white">
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="dropdown">Dropdown</option>
              <option value="file">File upload</option>
            </select>
            <button disabled={saving} type="button" onClick={handleAddQuestion} className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-night transition hover:bg-aqua disabled:opacity-50">
              <MessageSquarePlus className="h-4 w-4" /> Add question
            </button>
          </div>
          {newType === 'dropdown' && (
            <input value={newOptions} onChange={(event) => setNewOptions(event.target.value)} placeholder="Dropdown options, separated by commas" className="focus-ring mt-3 w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white placeholder:text-white/35" />
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/45">Loading questions...</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-white/45">{isAdmin ? 'No questions yet. Ask the first one when you need more client input.' : 'No questions yet.'}</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <article key={question.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h4 className="font-black leading-6">{question.question}</h4>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase text-white/45">{question.type}</span>
              </div>

              {isAdmin ? (
                <div className="mt-4 space-y-2">
                  {(question.answers || []).length === 0 ? (
                    <p className="text-sm text-white/42">No answer yet.</p>
                  ) : (
                    question.answers.map((answer) => (
                      <div key={answer.id} className="rounded-2xl border border-aqua/15 bg-aqua/[0.06] p-3">
                        <p className="text-sm leading-6 text-white/82">{answer.answer}</p>
                        <p className="mt-2 text-xs text-white/42">{answer.users?.email || 'Client'} - {formatDate(answer.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  {question.type === 'file' ? (
                    <div className="space-y-3">
                      <UploadDropzone projectId={projectId} userId={user.id} compact onUploaded={(uploaded) => handleFileAnswer(question.id, uploaded)} />
                      {drafts[question.id] && (
                        <p className="rounded-2xl border border-aqua/15 bg-aqua/[0.06] p-3 text-sm leading-6 text-white/78">
                          {drafts[question.id]}
                        </p>
                      )}
                    </div>
                  ) : question.type === 'dropdown' ? (
                    <select value={drafts[question.id] || ''} onChange={(event) => setDrafts({ ...drafts, [question.id]: event.target.value })} className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white">
                      <option value="">Select an answer</option>
                      {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : question.type === 'text' ? (
                    <input value={drafts[question.id] || ''} onChange={(event) => setDrafts({ ...drafts, [question.id]: event.target.value })} className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white" />
                  ) : (
                    <textarea value={drafts[question.id] || ''} onChange={(event) => setDrafts({ ...drafts, [question.id]: event.target.value })} rows="4" className="focus-ring w-full resize-none rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white" />
                  )}
                  {question.type !== 'file' && (
                    <button disabled={saving} type="button" onClick={() => handleAnswer(question.id)} className="focus-ring mt-3 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-night transition hover:bg-aqua disabled:opacity-50">
                      <Send className="h-4 w-4" /> Save answer
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
