import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Clock, Trophy, ArrowLeft,
  GraduationCap, CaretRight, Download,
} from '@phosphor-icons/react';
import { coursesApi } from '../../api/courses';
import SEO from '../../components/SEO';
import { CourseCardSkeleton } from '../../components/Skeletons';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState('courses');

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;

    setLoading(true);
    Promise.all([
      coursesApi.getMyEnrollments(params),
      tab === 'certificates' ? coursesApi.getMyCertificates() : Promise.resolve({ data: [] }),
    ])
      .then(([enrollRes, certRes]) => {
        setEnrollments(enrollRes.data.results || enrollRes.data || []);
        if (tab === 'certificates') setCertificates(certRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, tab]);

  useEffect(() => {
    if (tab === 'certificates') {
      coursesApi.getMyCertificates()
        .then(({ data }) => setCertificates(data))
        .catch(() => {});
    }
  }, [tab]);

  return (
    <>
      <SEO title="My Courses" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link to="/courses" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">My Learning</h1>
                <p className="text-sm text-gray-400">Track your progress and certificates</p>
              </div>
            </div>
            <Link
              to="/courses"
              className="px-4 py-2 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Browse Courses
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-warm-200 dark:border-white/10 mb-6">
            <button
              onClick={() => setTab('courses')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'courses'
                  ? 'text-taqon-orange border-taqon-orange'
                  : 'text-gray-500 border-transparent hover:text-taqon-charcoal dark:text-white'
              }`}
            >
              <BookOpen size={14} className="inline mr-2" />
              My Courses
            </button>
            <button
              onClick={() => setTab('certificates')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'certificates'
                  ? 'text-taqon-orange border-taqon-orange'
                  : 'text-gray-500 border-transparent hover:text-taqon-charcoal dark:text-white'
              }`}
            >
              <Trophy size={14} className="inline mr-2" />
              Certificates
            </button>
          </div>

          {tab === 'courses' && (
            <>
              {/* Status Filter */}
              <div className="flex gap-2 mb-6">
                {STATUS_TABS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStatusFilter(s.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                      statusFilter === s.value
                        ? 'bg-taqon-orange text-taqon-charcoal dark:text-white'
                        : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Enrollment List */}
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />)}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
                  <GraduationCap size={48} className="text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No Courses Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Start learning by enrolling in a course.</p>
                  <Link to="/courses" className="text-taqon-orange text-sm font-semibold hover:underline">
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enr, i) => (
                    <motion.div
                      key={enr.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        to={enr.status === 'completed' ? `/courses/${enr.course_slug}` : `/courses/learn/${enr.id}`}
                        className="group flex gap-4 bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5 hover:border-taqon-orange/30 transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="w-24 h-20 rounded-lg bg-gradient-to-br from-taqon-orange/20 to-taqon-charcoal overflow-hidden flex-shrink-0">
                          {enr.course_thumbnail ? (
                            <img src={enr.course_thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={20} className="text-taqon-orange" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-taqon-orange font-semibold capitalize">
                              {enr.course_category?.replace('_', ' ')}
                            </span>
                            {enr.status === 'completed' && (
                              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-xs font-semibold rounded">
                                Completed
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors line-clamp-1">
                            {enr.course_title}
                          </h3>

                          {/* Progress Bar */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>{enr.lessons_completed} lessons completed</span>
                              <span>{Math.round(parseFloat(enr.progress_percentage))}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  enr.status === 'completed' ? 'bg-green-400' : 'bg-taqon-orange'
                                }`}
                                style={{ width: `${enr.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <CaretRight size={16} className="text-gray-600 group-hover:text-taqon-orange transition-colors self-center" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'certificates' && (
            <>
              {certificates.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
                  <Trophy size={48} className="text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No Certificates Yet</h3>
                  <p className="text-sm text-gray-500">Complete a course to earn your first certificate.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {certificates.map((cert, i) => (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-gradient-to-br from-taqon-charcoal/80 to-taqon-dark rounded-xl p-6 border border-taqon-orange/20"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-taqon-orange/20 flex items-center justify-center">
                          <Trophy size={24} className="text-taqon-orange" />
                        </div>
                        <div>
                          <p className="font-semibold text-taqon-charcoal dark:text-white">{cert.course_title}</p>
                          <p className="text-xs text-gray-500">#{cert.certificate_number}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Issued: {new Date(cert.issued_at).toLocaleDateString()}</span>
                        <span className="text-taqon-orange font-mono">{cert.verification_code}</span>
                      </div>

                      {(cert.pdf || cert.pdf_url) && (
                        <a
                          href={cert.pdf || cert.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-taqon-charcoal dark:text-white text-sm rounded-lg transition-colors"
                        >
                          <Download size={14} /> Download PDF
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
