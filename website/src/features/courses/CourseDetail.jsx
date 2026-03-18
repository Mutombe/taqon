import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Clock, Users, Star, Play, Lock, Check,
  CaretDown, CaretUp, GraduationCap, Trophy,
  CircleNotch, ArrowLeft, FileText, Question, Wrench, Download,
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

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      coursesApi.getCourse(slug),
      coursesApi.getReviews(slug).catch(() => ({ data: { results: [] } })),
    ])
      .then(([courseRes, reviewsRes]) => {
        setCourse(courseRes.data);
        setReviews(reviewsRes.data.results || reviewsRes.data || []);
        // Expand first module by default
        if (courseRes.data.modules?.length > 0) {
          setExpandedModules({ [courseRes.data.modules[0].id]: true });
        }
      })
      .catch(() => toast.error('Course not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data } = await coursesApi.enroll(slug);
      toast.success('Successfully enrolled!');
      navigate(`/courses/learn/${data.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to enroll.';
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <DetailPageSkeleton />;

  if (!course) return null;

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <>
      <SEO title={course.title} description={course.short_description || course.subtitle} />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back */}
          <Link to="/courses" className="inline-flex items-center gap-2 text-gray-400 hover:text-taqon-charcoal dark:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Courses
          </Link>

          {/* Hero */}
          <div className="grid lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border mb-3 ${DIFFICULTY_COLORS[course.difficulty]}`}>
                  {course.difficulty}
                </span>
                <h1 className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">
                  {course.title}
                </h1>
                {course.subtitle && (
                  <p className="text-lg text-gray-400 mb-4">{course.subtitle}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                  {course.instructor_name && (
                    <span>By <strong className="text-taqon-charcoal dark:text-white">{course.instructor_name}</strong></span>
                  )}
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} /> {course.module_count} modules · {totalLessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {course.estimated_duration_hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {course.total_enrollments} enrolled
                  </span>
                  {course.average_rating > 0 && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star size={14} fill="currentColor" />
                      {parseFloat(course.average_rating).toFixed(1)}
                      <span className="text-gray-500">({course.total_reviews})</span>
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Enroll Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-taqon-charcoal/60 rounded-2xl p-6 border border-warm-200 dark:border-white/10 h-fit lg:sticky lg:top-28"
            >
              {/* Thumbnail */}
              {course.display_thumbnail && (
                <img
                  src={course.display_thumbnail}
                  alt={course.title}
                  className="w-full h-36 object-cover rounded-xl mb-4"
                />
              )}

              <div className="text-center mb-4">
                {course.is_free ? (
                  <p className="text-2xl font-bold text-green-400">Free</p>
                ) : (
                  <p className="text-2xl font-bold text-taqon-charcoal dark:text-white">${course.price} <span className="text-sm text-gray-500">{course.currency}</span></p>
                )}
              </div>

              {course.is_enrolled ? (
                <Link
                  to={`/courses/learn/${course.enrollment_id}`}
                  className="block w-full py-3 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-xl text-center transition-colors mb-3"
                >
                  Continue Learning ({Math.round(course.progress_percentage)}%)
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full py-3 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
                >
                  {enrolling ? <CircleNotch size={18} className="animate-spin" /> : <GraduationCap size={18} />}
                  {course.is_free ? 'Enroll Free' : 'Enroll Now'}
                </button>
              )}

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-400" /> Lifetime access
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-400" /> Certificate on completion
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-400" /> Mobile-friendly
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-warm-200 dark:border-white/10 mb-6 overflow-x-auto">
            {['overview', 'curriculum', 'reviews'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-semibold capitalize whitespace-nowrap transition-colors border-b-2 ${
                  tab === t
                    ? 'text-taqon-orange border-taqon-orange'
                    : 'text-gray-500 border-transparent hover:text-taqon-charcoal dark:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Description */}
                <div className="prose prose-invert max-w-none mb-8">
                  <div className="text-gray-300 whitespace-pre-line">{course.description}</div>
                </div>

                {/* Learning Outcomes */}
                {course.learning_outcomes?.length > 0 && (
                  <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl p-6 border border-warm-100 dark:border-white/5 mb-6">
                    <h3 className="text-lg font-bold text-taqon-charcoal dark:text-white mb-4 flex items-center gap-2">
                      <Trophy size={18} className="text-taqon-orange" /> What You'll Learn
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {course.learning_outcomes.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {course.requirements?.length > 0 && (
                  <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl p-6 border border-warm-100 dark:border-white/5 mb-6">
                    <h3 className="text-lg font-bold text-taqon-charcoal dark:text-white mb-3">Prerequisites</h3>
                    <ul className="space-y-2">
                      {course.requirements.map((req, i) => (
                        <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-taqon-orange mt-1">•</span> {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructor */}
                {course.instructor_name && (
                  <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl p-6 border border-warm-100 dark:border-white/5">
                    <h3 className="text-lg font-bold text-taqon-charcoal dark:text-white mb-3">Instructor</h3>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-taqon-orange/20 flex items-center justify-center flex-shrink-0">
                        {course.instructor_avatar ? (
                          <img src={course.instructor_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <GraduationCap size={24} className="text-taqon-orange" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-taqon-charcoal dark:text-white">{course.instructor_name}</p>
                        {course.instructor_bio && (
                          <p className="text-sm text-gray-400 mt-1">{course.instructor_bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'curriculum' && (
              <motion.div key="curriculum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-3">
                  {course.modules?.map((module) => (
                    <div key={module.id} className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-8 h-8 rounded-lg bg-taqon-orange/10 flex items-center justify-center text-taqon-orange text-sm font-bold">
                            {module.order + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-taqon-charcoal dark:text-white text-sm">{module.title}</h4>
                            <p className="text-xs text-gray-500">
                              {module.lesson_count} lessons · {module.total_duration_minutes} min
                            </p>
                          </div>
                        </div>
                        {expandedModules[module.id]
                          ? <CaretUp size={16} className="text-gray-500" />
                          : <CaretDown size={16} className="text-gray-500" />
                        }
                      </button>

                      <AnimatePresence>
                        {expandedModules[module.id] && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-warm-100 dark:border-white/5">
                              {module.lessons?.map((lesson) => {
                                const Icon = LESSON_TYPE_ICONS[lesson.lesson_type] || FileText;
                                return (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center gap-3 px-4 py-3 border-b border-warm-100 dark:border-white/5 last:border-b-0"
                                  >
                                    <Icon size={14} className="text-gray-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-300 flex-1">{lesson.title}</span>
                                    {lesson.duration_minutes > 0 && (
                                      <span className="text-xs text-gray-600">{lesson.duration_minutes} min</span>
                                    )}
                                    {lesson.is_free_preview ? (
                                      <span className="text-xs text-green-400">Preview</span>
                                    ) : !course.is_enrolled ? (
                                      <Lock size={12} className="text-gray-600" />
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-taqon-charcoal/30 rounded-xl border border-warm-100 dark:border-white/5">
                    <Star size={32} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No reviews yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white dark:bg-taqon-charcoal/40 rounded-xl p-5 border border-warm-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-taqon-charcoal dark:text-white text-sm">{review.user_name}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < review.rating ? 'text-yellow-400' : 'text-gray-600'}
                                fill={i < review.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                        </div>
                        {review.title && <p className="text-sm font-medium text-taqon-charcoal dark:text-white mb-1">{review.title}</p>}
                        {review.comment && <p className="text-sm text-gray-400">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
