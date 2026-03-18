import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Clock, User, Phone, EnvelopeSimple,
  CircleNotch, Warning, CheckCircle, Play, Pause, NavigationArrow,
  ChatsTeardrop, Camera, Star, CaretDown, PaperPlaneTilt,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { technicianApi } from '../../api/technician';
import { DetailPageSkeleton } from '../../components/Skeletons';
import SEO from '../../components/SEO';

const STATUS_COLORS = {
  unassigned: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_route: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-taqon-orange/10 text-taqon-orange border-taqon-orange/20',
  on_hold: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const TRANSITION_BUTTONS = {
  assigned: [
    { status: 'en_route', label: 'Start Route', icon: NavigationArrow, color: 'bg-yellow-500 hover:bg-yellow-600' },
  ],
  en_route: [
    { status: 'in_progress', label: 'Start Work', icon: Play, color: 'bg-taqon-orange hover:bg-taqon-orange/90' },
  ],
  in_progress: [
    { status: 'on_hold', label: 'Pause', icon: Pause, color: 'bg-red-500 hover:bg-red-600' },
    { status: 'completed', label: 'Complete Job', icon: CheckCircle, color: 'bg-green-500 hover:bg-green-600' },
  ],
  on_hold: [
    { status: 'in_progress', label: 'Resume', icon: Play, color: 'bg-taqon-orange hover:bg-taqon-orange/90' },
  ],
};

export default function TechnicianJobDetail() {
  const { jobNumber } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Note form
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Completion form
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionSummary, setCompletionSummary] = useState('');
  const [actualHours, setActualHours] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadJob();
  }, [jobNumber]);

  const loadJob = () => {
    setLoading(true);
    technicianApi.getJob(jobNumber)
      .then(({ data }) => setJob(data))
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load job details.');
      })
      .finally(() => setLoading(false));
  };

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'completed') {
      setShowCompletionForm(true);
      return;
    }

    setUpdating(true);
    try {
      const { data } = await technicianApi.updateJobStatus(jobNumber, { status: newStatus });
      setJob(data);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    setUpdating(true);
    try {
      const { data } = await technicianApi.updateJobStatus(jobNumber, {
        status: 'completed',
        completion_summary: completionSummary,
        actual_duration_hours: actualHours ? parseFloat(actualHours) : null,
      });
      setJob(data);
      setShowCompletionForm(false);
      toast.success('Job completed!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete job.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      await technicianApi.addJobNote(jobNumber, { content: noteContent });
      setNoteContent('');
      setShowNoteForm(false);
      loadJob();
      toast.success('Note added.');
    } catch (err) {
      toast.error('Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) return <DetailPageSkeleton />;

  if (!job) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center pt-20">
        <div className="text-center">
          <Warning size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-taqon-charcoal dark:text-white">Job Not Found</h2>
          <Link to="/technician/jobs" className="text-taqon-orange hover:underline mt-2 inline-block">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const transitions = TRANSITION_BUTTONS[job.status] || [];
  const statusColor = STATUS_COLORS[job.status] || '';

  return (
    <>
      <SEO title={`Job ${job.job_number}`} />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/technician/jobs" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 font-mono">{job.job_number}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusColor}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white truncate">{job.title}</h1>
            </div>
          </div>

          {/* Status Action Buttons */}
          {transitions.length > 0 && (
            <div className="flex gap-3 mb-6">
              {transitions.map((btn) => (
                <button
                  key={btn.status}
                  onClick={() => handleStatusUpdate(btn.status)}
                  disabled={updating}
                  className={`flex-1 py-3 px-4 ${btn.color} text-taqon-charcoal dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  {updating ? <CircleNotch size={18} className="animate-spin" /> : <btn.icon size={18} />}
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Completion Form */}
          <AnimatePresence>
            {showCompletionForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-green-500/5 border border-green-500/20 rounded-xl p-5 overflow-hidden"
              >
                <h3 className="text-lg font-semibold text-taqon-charcoal dark:text-white mb-3">Complete Job</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Completion Summary</label>
                    <textarea
                      value={completionSummary}
                      onChange={(e) => setCompletionSummary(e.target.value)}
                      rows={3}
                      className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-green-500 focus:ring-0"
                      placeholder="Describe the work completed..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Actual Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={actualHours}
                      onChange={(e) => setActualHours(e.target.value)}
                      className="w-32 bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-green-500 focus:ring-0"
                      placeholder="e.g. 3.5"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleComplete}
                      disabled={updating}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-taqon-charcoal dark:text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {updating ? <CircleNotch size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      Confirm Completion
                    </button>
                    <button
                      onClick={() => setShowCompletionForm(false)}
                      className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white dark:bg-taqon-charcoal/30 p-1 rounded-xl">
            {['details', 'notes', 'photos', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-taqon-orange text-taqon-charcoal dark:text-white'
                    : 'text-gray-400 hover:text-taqon-charcoal dark:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Description */}
              {job.description && (
                <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{job.description}</p>
                </div>
              )}

              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5">
                  <span className="text-xs text-gray-500 uppercase">Type</span>
                  <p className="text-taqon-charcoal dark:text-white font-semibold capitalize">{job.job_type}</p>
                </div>
                <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5">
                  <span className="text-xs text-gray-500 uppercase">Priority</span>
                  <p className="text-taqon-charcoal dark:text-white font-semibold capitalize">{job.priority}</p>
                </div>
                {job.scheduled_date && (
                  <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5">
                    <span className="text-xs text-gray-500 uppercase flex items-center gap-1">
                      <Calendar size={12} /> Scheduled
                    </span>
                    <p className="text-taqon-charcoal dark:text-white font-semibold">{job.scheduled_date}</p>
                    {job.scheduled_time_start && (
                      <p className="text-sm text-gray-400">
                        {job.scheduled_time_start} – {job.scheduled_time_end || '?'}
                      </p>
                    )}
                  </div>
                )}
                <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5">
                  <span className="text-xs text-gray-500 uppercase flex items-center gap-1">
                    <Clock size={12} /> Duration
                  </span>
                  <p className="text-taqon-charcoal dark:text-white font-semibold">{job.estimated_duration_hours}h estimated</p>
                  {job.actual_duration_hours && (
                    <p className="text-sm text-gray-400">{job.actual_duration_hours}h actual</p>
                  )}
                </div>
              </div>

              {/* Customer */}
              <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</h3>
                <div className="space-y-2">
                  {job.customer_name && (
                    <p className="flex items-center gap-2 text-taqon-charcoal dark:text-white">
                      <User size={16} className="text-gray-500" /> {job.customer_name}
                    </p>
                  )}
                  {job.customer_phone && (
                    <a href={`tel:${job.customer_phone}`} className="flex items-center gap-2 text-taqon-orange hover:underline">
                      <Phone size={16} className="text-gray-500" /> {job.customer_phone}
                    </a>
                  )}
                  {job.customer_email && (
                    <a href={`mailto:${job.customer_email}`} className="flex items-center gap-2 text-taqon-orange hover:underline">
                      <EnvelopeSimple size={16} className="text-gray-500" /> {job.customer_email}
                    </a>
                  )}
                </div>
              </div>

              {/* Location */}
              {(job.address || job.city) && (
                <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Location</h3>
                  <p className="flex items-start gap-2 text-taqon-charcoal dark:text-white">
                    <MapPin size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>
                      {job.address && <>{job.address}<br /></>}
                      {job.city}{job.province && `, ${job.province}`}
                    </span>
                  </p>
                </div>
              )}

              {/* Completion Summary */}
              {job.completion_summary && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-2">Completion Summary</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{job.completion_summary}</p>
                </div>
              )}

              {/* Customer Rating */}
              {job.customer_rating && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-2">Customer Feedback</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={18} className={s <= job.customer_rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                    ))}
                  </div>
                  {job.customer_feedback && <p className="text-gray-300 text-sm">{job.customer_feedback}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="w-full py-3 bg-white dark:bg-taqon-charcoal/50 border border-dashed border-warm-200 dark:border-white/10 hover:border-taqon-orange/30 rounded-xl text-sm font-semibold text-gray-400 hover:text-taqon-orange transition-colors flex items-center justify-center gap-2"
              >
                <ChatsTeardrop size={16} /> Add Note
              </button>

              <AnimatePresence>
                {showNoteForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={3}
                        className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-taqon-orange focus:ring-0 mb-3"
                        placeholder="Write a note..."
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={addingNote || !noteContent.trim()}
                        className="px-4 py-2 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {addingNote ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
                        Add Note
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {job.notes?.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No notes yet.</p>
              ) : (
                job.notes?.map((note) => (
                  <div key={note.id} className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">{note.author_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              {job.photos?.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-xl border border-warm-100 dark:border-white/5">
                  <Camera size={40} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No photos uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {job.photos.map((photo) => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-warm-100 dark:border-white/5">
                      <img
                        src={photo.image || photo.image_url}
                        alt={photo.caption || photo.photo_type}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-3">
                        <span className="text-xs text-gray-600 dark:text-white/80 capitalize">{photo.photo_type.replace('_', ' ')}</span>
                        {photo.caption && <p className="text-xs text-gray-500 dark:text-white/60 truncate">{photo.caption}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {job.status_history?.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No status history.</p>
              ) : (
                job.status_history?.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-taqon-orange" />
                      {i < job.status_history.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-100 dark:bg-white/10 mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-taqon-charcoal dark:text-white capitalize">
                          {entry.new_status.replace('_', ' ')}
                        </span>
                        {entry.old_status && (
                          <span className="text-gray-500">from {entry.old_status.replace('_', ' ')}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {entry.changed_by_name} · {new Date(entry.created_at).toLocaleString()}
                      </p>
                      {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
