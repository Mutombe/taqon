import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CaretLeft, CaretRight, Play, FileText,
  Question, Wrench, Download, Check, CheckCircle,
  CircleNotch, BookOpen, Lock, Clock, Notepad,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { coursesApi } from '../../api/courses';
import { DetailPageSkeleton } from '../../components/Skeletons';
import SEO from '../../components/SEO';

const LESSON_TYPE_ICONS = {
  video: Play,
  text: FileText,
  quiz: Question,
  practical: Wrench,
  download: Download,
};

export default function LessonViewer() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  useEffect(() => {
    coursesApi.getEnrollment(enrollmentId)
      .then(({ data }) => {
        setEnrollment(data);
        // Find first incomplete lesson or first lesson
        const allLessons = getAllLessons(data.course);
        const firstIncomplete = allLessons.find((l) => {
          const progress = data.lesson_progress?.find((p) => p.lesson === l.id);
          return !progress?.is_completed;
        });
        if (firstIncomplete) loadLesson(firstIncomplete.id);
        else if (allLessons.length > 0) loadLesson(allLessons[0].id);
      })
      .catch(() => toast.error('Enrollment not found.'))
      .finally(() => setLoading(false));
  }, [enrollmentId]);

  const getAllLessons = (course) => {
    if (!course?.modules) return [];
    return course.modules.flatMap((m) => m.lessons || []);
  };

  const loadLesson = useCallback(async (lessonId) => {
    setLessonLoading(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    try {
      const { data } = await coursesApi.getLessonContent(enrollmentId, lessonId);
      setLessonData(data);
      setCurrentLesson(lessonId);
      setNotes(data.progress?.notes || '');
    } catch {
      toast.error('Failed to load lesson.');
    } finally {
      setLessonLoading(false);
    }
  }, [enrollmentId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const updateData = { mark_complete: true };
      if (notes) updateData.notes = notes;
      await coursesApi.updateLessonProgress(enrollmentId, currentLesson, updateData);
      toast.success('Lesson completed!');
      // Refresh enrollment data to update progress
      const { data } = await coursesApi.getEnrollment(enrollmentId);
      setEnrollment(data);
      // Auto-advance to next lesson
      const allLessons = getAllLessons(data.course);
      const currentIdx = allLessons.findIndex((l) => l.id === currentLesson);
      if (currentIdx < allLessons.length - 1) {
        loadLesson(allLessons[currentIdx + 1].id);
      }
    } catch {
      toast.error('Failed to update progress.');
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!lessonData?.quiz_data) return;
    const total = lessonData.quiz_data.length;
    let correct = 0;
    lessonData.quiz_data.forEach((q, i) => {
      if (quizAnswers[i] === q.correct_index) correct++;
    });
    const score = Math.round((correct / total) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    try {
      await coursesApi.updateLessonProgress(enrollmentId, currentLesson, {
        quiz_answers: Object.values(quizAnswers),
        quiz_score: score,
        mark_complete: score >= (lessonData.passing_score || 70),
      });
      if (score >= (lessonData.passing_score || 70)) {
        toast.success(`Passed! Score: ${score}%`);
        const { data } = await coursesApi.getEnrollment(enrollmentId);
        setEnrollment(data);
      } else {
        toast.error(`Score: ${score}%. Need ${lessonData.passing_score}% to pass.`);
      }
    } catch {
      // Progress saved locally
    }
  };

  const saveNotes = async () => {
    try {
      await coursesApi.updateLessonProgress(enrollmentId, currentLesson, { notes });
      toast.success('Notes saved.');
    } catch {
      toast.error('Failed to save notes.');
    }
  };

  if (loading) return <DetailPageSkeleton />;

  if (!enrollment) return null;

  const course = enrollment.course;
  const allLessons = getAllLessons(course);
  const currentIdx = allLessons.findIndex((l) => l.id === currentLesson);
  const isLessonCompleted = (lessonId) =>
    enrollment.lesson_progress?.some((p) => p.lesson === lessonId && p.is_completed);

  return (
    <>
      <SEO title={lessonData?.title || 'Learning'} />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex flex-col">
        {/* Top Bar */}
        <div className="bg-white dark:bg-taqon-charcoal border-b border-warm-200 dark:border-white/10 px-4 py-3 flex items-center justify-between mt-20 lg:mt-24">
          <div className="flex items-center gap-3">
            <Link to={`/courses/${course.slug}`} className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-taqon-charcoal dark:text-white line-clamp-1">{course.title}</p>
              <p className="text-xs text-gray-500">
                {Math.round(parseFloat(enrollment.progress_percentage))}% complete
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex-1 max-w-xs mx-4">
            <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-taqon-orange rounded-full transition-all duration-500"
                style={{ width: `${enrollment.progress_percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg transition-colors ${showNotes ? 'bg-taqon-orange/20 text-taqon-orange' : 'text-gray-400 hover:text-taqon-charcoal dark:text-white'}`}
            >
              <Notepad size={16} />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-taqon-charcoal dark:text-white rounded-lg transition-colors lg:hidden"
            >
              <BookOpen size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-white dark:bg-taqon-charcoal/80 border-r border-warm-200 dark:border-white/10 overflow-y-auto flex-shrink-0 hidden lg:block"
              >
                <div className="p-4">
                  {course.modules?.map((module) => (
                    <div key={module.id} className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                        {module.title}
                      </h4>
                      <div className="space-y-0.5">
                        {module.lessons?.map((lesson) => {
                          const Icon = LESSON_TYPE_ICONS[lesson.lesson_type] || FileText;
                          const completed = isLessonCompleted(lesson.id);
                          const isCurrent = lesson.id === currentLesson;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => loadLesson(lesson.id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                isCurrent
                                  ? 'bg-taqon-orange/10 text-taqon-orange'
                                  : completed
                                    ? 'text-green-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                    : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                              }`}
                            >
                              {completed ? (
                                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                              ) : (
                                <Icon size={14} className="flex-shrink-0" />
                              )}
                              <span className="flex-1 line-clamp-1">{lesson.title}</span>
                              {lesson.duration_minutes > 0 && (
                                <span className="text-xs text-gray-600">{lesson.duration_minutes}m</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {lessonLoading ? (
              <div className="py-10 px-6 animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-white/10 rounded-lg w-72" />
                <div className="h-64 bg-gray-200 dark:bg-white/10 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-5/6" />
                  <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ) : !lessonData ? (
              <div className="text-center py-20 text-gray-500">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-600" />
                <p>Select a lesson to begin.</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto p-6">
                {/* Lesson Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    {(() => {
                      const Icon = LESSON_TYPE_ICONS[lessonData.lesson_type] || FileText;
                      return <Icon size={12} />;
                    })()}
                    <span className="capitalize">{lessonData.lesson_type}</span>
                    {lessonData.duration_minutes > 0 && (
                      <>
                        <span>·</span>
                        <Clock size={12} />
                        <span>{lessonData.duration_minutes} min</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">{lessonData.title}</h2>
                </div>

                {/* Video Content */}
                {lessonData.lesson_type === 'video' && lessonData.video_url && (
                  <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video">
                    {lessonData.video_url.includes('youtube') || lessonData.video_url.includes('youtu.be') ? (
                      <iframe
                        src={lessonData.video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={lessonData.title}
                      />
                    ) : (
                      <video src={lessonData.video_url} controls className="w-full h-full" />
                    )}
                  </div>
                )}

                {/* Text Content */}
                {lessonData.content && (
                  <div className="prose prose-invert max-w-none mb-6">
                    <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                      {lessonData.content}
                    </div>
                  </div>
                )}

                {/* Quiz Content */}
                {lessonData.lesson_type === 'quiz' && lessonData.quiz_data?.length > 0 && (
                  <div className="space-y-6 mb-6">
                    {lessonData.quiz_data.map((q, qi) => (
                      <div key={qi} className="bg-white dark:bg-taqon-charcoal/40 rounded-xl p-5 border border-warm-100 dark:border-white/5">
                        <p className="font-semibold text-taqon-charcoal dark:text-white mb-3">
                          {qi + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options?.map((opt, oi) => {
                            let optClass = 'bg-gray-50 dark:bg-white/5 text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 border-transparent';
                            if (quizSubmitted) {
                              if (oi === q.correct_index) optClass = 'bg-green-500/10 text-green-400 border-green-500/30';
                              else if (quizAnswers[qi] === oi) optClass = 'bg-red-500/10 text-red-400 border-red-500/30';
                            } else if (quizAnswers[qi] === oi) {
                              optClass = 'bg-taqon-orange/10 text-taqon-orange border-taqon-orange/30';
                            }
                            return (
                              <button
                                key={oi}
                                onClick={() => !quizSubmitted && setQuizAnswers((p) => ({ ...p, [qi]: oi }))}
                                disabled={quizSubmitted}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors ${optClass}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && q.explanation && (
                          <p className="text-sm text-gray-400 mt-3 bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}

                    {!quizSubmitted ? (
                      <button
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(quizAnswers).length < lessonData.quiz_data.length}
                        className="w-full py-3 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        Submit Quiz
                      </button>
                    ) : (
                      <div className={`text-center p-4 rounded-xl ${quizScore >= lessonData.passing_score ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <p className="text-lg font-bold">Score: {quizScore}%</p>
                        <p className="text-sm">
                          {quizScore >= lessonData.passing_score
                            ? 'Congratulations! You passed.'
                            : `You need ${lessonData.passing_score}% to pass. Try again!`
                          }
                        </p>
                        {quizScore < lessonData.passing_score && (
                          <button
                            onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setQuizScore(null); }}
                            className="mt-2 text-sm underline"
                          >
                            Retry Quiz
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {(lessonData.attachment || lessonData.attachment_url) && (
                  <div className="mb-6">
                    <a
                      href={lessonData.attachment || lessonData.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-taqon-charcoal dark:text-white rounded-lg text-sm transition-colors"
                    >
                      <Download size={16} /> Download Resource
                    </a>
                  </div>
                )}

                {/* External Links */}
                {lessonData.external_links?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Additional Resources</h4>
                    <div className="space-y-1">
                      {lessonData.external_links.map((link, i) => (
                        <a
                          key={i}
                          href={typeof link === 'string' ? link : link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-taqon-orange hover:underline"
                        >
                          {typeof link === 'string' ? link : link.title || link.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes Panel */}
                <AnimatePresence>
                  {showNotes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                        <Notepad size={14} /> Your Notes
                      </h4>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-taqon-orange focus:ring-0 mb-2"
                        placeholder="Take notes on this lesson..."
                      />
                      <button
                        onClick={saveNotes}
                        className="text-sm text-taqon-orange hover:underline"
                      >
                        Save Notes
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Complete + Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-warm-200 dark:border-white/10">
                  <button
                    onClick={() => currentIdx > 0 && loadLesson(allLessons[currentIdx - 1].id)}
                    disabled={currentIdx <= 0}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors disabled:opacity-30"
                  >
                    <CaretLeft size={16} /> Previous
                  </button>

                  {!isLessonCompleted(currentLesson) && lessonData.lesson_type !== 'quiz' && (
                    <button
                      onClick={handleComplete}
                      disabled={completing}
                      className="px-6 py-2.5 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {completing ? <CircleNotch size={16} className="animate-spin" /> : <Check size={16} />}
                      Mark Complete
                    </button>
                  )}
                  {isLessonCompleted(currentLesson) && (
                    <span className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                      <CheckCircle size={16} /> Completed
                    </span>
                  )}

                  <button
                    onClick={() => currentIdx < allLessons.length - 1 && loadLesson(allLessons[currentIdx + 1].id)}
                    disabled={currentIdx >= allLessons.length - 1}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors disabled:opacity-30"
                  >
                    Next <CaretRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
