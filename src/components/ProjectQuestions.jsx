import { ArrowLeft, ArrowRight, CheckCircle2, MessageSquarePlus, Pencil, Save, Send, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { addProjectQuestion, answerProjectQuestion, deleteProjectQuestion, formatDate, getProjectQuestions, updateProjectQuestion } from '../services/api';
import UploadDropzone from './UploadDropzone';

export default function ProjectQuestions({ projectId, user }) {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newType, setNewType] = useState('textarea');
  const [newOptions, setNewOptions] = useState('');
  const [drafts, setDrafts] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [savedAt, setSavedAt] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState('');
  const [editDraft, setEditDraft] = useState({ question: '', type: 'textarea', options: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autosaveRef = useRef({});

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
  const answeredCount = Math.max(0, questions.length - unanswered);
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const activeQuestion = questions[currentStep] || questions[0];

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSaving(true);
    try {
      await addProjectQuestion({
        projectId,
        question: newQuestion,
        type: newType,
        options: ['dropdown', 'multiple_choice'].includes(newType) ? newOptions.split(',').map((option) => option.trim()).filter(Boolean) : [],
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

  const markQuestionAnswered = useCallback((questionId, answer) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId) return question;
      const nextAnswer = {
        id: `local-${questionId}`,
        question_id: questionId,
        user_id: user.id,
        answer,
        created_at: new Date().toISOString(),
        users: { email: user.email },
      };
      const answers = question.answers || [];
      const hasOwnAnswer = answers.some((item) => item.user_id === user.id);
      return {
        ...question,
        answers: hasOwnAnswer
          ? answers.map((item) => (item.user_id === user.id ? { ...item, answer } : item))
          : [...answers, nextAnswer],
      };
    }));
  }, [user.email, user.id]);

  const startEditQuestion = (question) => {
    setEditingQuestionId(question.id);
    setEditDraft({
      question: question.question,
      type: question.type || 'textarea',
      options: (question.options || []).join(', '),
    });
  };

  const saveQuestionEdit = async () => {
    if (!editingQuestionId || !editDraft.question.trim()) return;
    setSaving(true);
    try {
      await updateProjectQuestion({
        questionId: editingQuestionId,
        question: editDraft.question,
        type: editDraft.type,
        options: ['dropdown', 'multiple_choice'].includes(editDraft.type)
          ? editDraft.options.split(',').map((option) => option.trim()).filter(Boolean)
          : [],
      });
      toast.success('Question updated');
      setEditingQuestionId('');
      load();
    } catch (error) {
      toast.error(error.message || 'Unable to update question');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (question) => {
    if (!window.confirm(`Delete question "${question.question}"? Client answers for this question will also be removed.`)) return;
    setSaving(true);
    try {
      await deleteProjectQuestion(question.id);
      toast.success('Question deleted');
      setEditingQuestionId('');
      load();
    } catch (error) {
      toast.error(error.message || 'Unable to delete question');
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
      markQuestionAnswered(questionId, answer);
      setSavedAt((current) => ({ ...current, [questionId]: new Date().toISOString() }));
    } catch (error) {
      toast.error(error.message || 'Unable to save answer');
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (questionId, value, autosave = true) => {
    setDrafts((current) => ({ ...current, [questionId]: value }));
    if (isAdmin || !autosave || !value.trim()) return;
    clearTimeout(autosaveRef.current[questionId]);
    autosaveRef.current[questionId] = setTimeout(async () => {
      try {
        await answerProjectQuestion({ questionId, answer: value.trim() });
        markQuestionAnswered(questionId, value.trim());
        setSavedAt((current) => ({ ...current, [questionId]: new Date().toISOString() }));
      } catch {
        toast.error('Autosave failed');
      }
    }, 900);
  };

  useEffect(() => () => {
    Object.values(autosaveRef.current).forEach(clearTimeout);
  }, []);

  const handleFileAnswer = async (questionId, uploaded) => {
    const answer = `${uploaded.name || 'Uploaded file'} (${uploaded.file_path || uploaded.file_url})`;
    setDrafts((current) => ({ ...current, [questionId]: answer }));
    setSaving(true);
    try {
      await answerProjectQuestion({ questionId, answer });
      markQuestionAnswered(questionId, answer);
      toast.success('File answer saved');
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
      {!isAdmin && (
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/52">
            <span>{answeredCount} of {questions.length} answered</span>
            <span>{completion}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-aqua via-violet to-ember transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <textarea value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} rows="3" placeholder="Ask a project-specific question or follow-up" className="focus-ring w-full resize-none rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white placeholder:text-white/35" />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select value={newType} onChange={(event) => setNewType(event.target.value)} className="focus-ring rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white">
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="dropdown">Dropdown</option>
              <option value="multiple_choice">Multiple choice</option>
              <option value="file">File reference/link</option>
            </select>
            <button disabled={saving} type="button" onClick={handleAddQuestion} className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-night transition hover:bg-aqua disabled:opacity-50">
              <MessageSquarePlus className="h-4 w-4" /> Add question
            </button>
          </div>
          {['dropdown', 'multiple_choice'].includes(newType) && (
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
          {(isAdmin ? questions : [activeQuestion]).filter(Boolean).map((question) => (
            <article key={question.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h4 className="font-black leading-6">{question.question}</h4>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase text-white/45">{question.type}</span>
              </div>

              {isAdmin ? (
                <div className="mt-4 space-y-2">
                  {editingQuestionId === question.id ? (
                    <div className="mb-4 rounded-2xl border border-violet/20 bg-violet/[0.06] p-3">
                      <textarea value={editDraft.question} onChange={(event) => setEditDraft({ ...editDraft, question: event.target.value })} rows="3" className="focus-ring w-full resize-none rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white" />
                      <div className="mt-3 grid gap-3 sm:grid-cols-[12rem_1fr]">
                        <select value={editDraft.type} onChange={(event) => setEditDraft({ ...editDraft, type: event.target.value })} className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white">
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="dropdown">Dropdown</option>
                          <option value="multiple_choice">Multiple choice</option>
                          <option value="file">File reference/link</option>
                        </select>
                        <input value={editDraft.options} onChange={(event) => setEditDraft({ ...editDraft, options: event.target.value })} disabled={!['dropdown', 'multiple_choice'].includes(editDraft.type)} placeholder="Options, separated by commas" className="focus-ring rounded-xl border border-white/10 bg-night px-3 py-2 text-sm text-white placeholder:text-white/35 disabled:opacity-35" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" disabled={saving} onClick={saveQuestionEdit} className="focus-ring flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-night transition hover:bg-aqua disabled:opacity-50">
                          <Save className="h-4 w-4" />
                          Save question
                        </button>
                        <button type="button" onClick={() => setEditingQuestionId('')} className="focus-ring flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/65">
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEditQuestion(question)} className="focus-ring flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/65 transition hover:border-violet/30 hover:text-white">
                        <Pencil className="h-4 w-4" />
                        Edit question
                      </button>
                      <button type="button" disabled={saving} onClick={() => removeQuestion(question)} className="focus-ring flex items-center gap-2 rounded-xl border border-ember/25 bg-ember/10 px-3 py-2 text-xs font-black text-ember disabled:opacity-50">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
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
                    <select value={drafts[question.id] || ''} onChange={(event) => updateDraft(question.id, event.target.value)} className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white">
                      <option value="">Select an answer</option>
                      {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : question.type === 'multiple_choice' ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(question.options || []).map((option) => (
                        <button key={option} type="button" onClick={() => updateDraft(question.id, option)} className={`focus-ring rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${drafts[question.id] === option ? 'border-aqua/35 bg-aqua/10 text-aqua' : 'border-white/10 bg-night text-white/65'}`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : question.type === 'text' ? (
                    <input value={drafts[question.id] || ''} onChange={(event) => updateDraft(question.id, event.target.value)} className="focus-ring w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white" />
                  ) : (
                    <textarea value={drafts[question.id] || ''} onChange={(event) => updateDraft(question.id, event.target.value)} rows="4" className="focus-ring w-full resize-none rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-white" />
                  )}
                  {question.type !== 'file' && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button disabled={saving} type="button" onClick={() => handleAnswer(question.id)} className="focus-ring flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-night transition hover:bg-aqua disabled:opacity-50">
                        <Send className="h-4 w-4" /> Save answer
                      </button>
                      {savedAt[question.id] && <span className="flex items-center gap-2 text-xs font-bold text-white/38"><Save className="h-3.5 w-3.5" /> Autosaved</span>}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
          {!isAdmin && questions.length > 1 && (
            <div className="flex items-center justify-between gap-3">
              <button type="button" disabled={currentStep === 0} onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} className="focus-ring flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/70 disabled:opacity-35">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="flex items-center gap-2 text-xs font-black text-white/45">
                <CheckCircle2 className="h-4 w-4 text-aqua" />
                Step {currentStep + 1} of {questions.length}
              </span>
              <button type="button" disabled={currentStep >= questions.length - 1} onClick={() => setCurrentStep((step) => Math.min(questions.length - 1, step + 1))} className="focus-ring flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/70 disabled:opacity-35">
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
