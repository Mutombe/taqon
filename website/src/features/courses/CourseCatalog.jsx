import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Clock, Users, Star, MagnifyingGlass, Funnel,
  GraduationCap, CaretRight,
} from '@phosphor-icons/react';
import SEO from '../../components/SEO';
import { CourseCardSkeleton } from '../../components/Skeletons';
import { useCourses, useCourseCategories } from '../../hooks/useQueries';

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/10 text-green-400',
  intermediate: 'bg-yellow-500/10 text-yellow-400',
  advanced: 'bg-red-500/10 text-red-400',
};

const CATEGORY_LABELS = {
  solar_fundamentals: 'Solar Fundamentals',
  installation: 'Installation',
  maintenance: 'Maintenance & Repair',
  battery_storage: 'Battery Storage',
  inverters: 'Inverters',
  electrical: 'Electrical Safety',
  business: 'Solar Business',
  diy: 'DIY Solar',
  borehole: 'Borehole Systems',
};

const CATEGORY_ICONS = {
  solar_fundamentals: '☀️',
  installation: '🔧',
  maintenance: '🛠️',
  battery_storage: '🔋',
  inverters: '⚡',
  electrical: '🔌',
  business: '💼',
  diy: '🏠',
  borehole: '💧',
};

export default function CourseCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const category = searchParams.get('category') || '';
  const difficulty = searchParams.get('difficulty') || '';

  // Build query params
  const courseParams = useMemo(() => {
    const params = {};
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;
    if (searchParams.get('search')) params.search = searchParams.get('search');
    return params;
  }, [category, difficulty, searchParams]);

  // React Query: cached and deduplicated
  const { data: categoriesData } = useCourseCategories();
  const { data: coursesData, isLoading: loading } = useCourses(courseParams);

  const categories = categoriesData || [];
  const courses = coursesData?.results || coursesData || [];

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', search);
  };

  return (
    <>
      <SEO
        title="Solar Training Courses"
        description="Learn solar energy skills with our professional courses — from beginner fundamentals to advanced installation techniques."
      />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-taqon-orange/10 text-taqon-orange px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <GraduationCap size={16} />
              Taqon Academy
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white mb-3">
              Solar Training Courses
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Master solar energy — from fundamentals to professional installation.
              Earn certificates and advance your career.
            </p>
          </motion.div>

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full bg-white dark:bg-taqon-charcoal/50 text-taqon-charcoal dark:text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-warm-200 dark:border-white/10 focus:border-taqon-orange focus:ring-0 min-h-[44px]"
              />
            </form>
            <select
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="bg-white dark:bg-taqon-charcoal/50 text-taqon-charcoal dark:text-white text-sm rounded-xl px-4 py-2.5 border border-warm-200 dark:border-white/10 focus:border-taqon-orange focus:ring-0 min-h-[44px]"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(e) => updateFilter('difficulty', e.target.value)}
              className="bg-white dark:bg-taqon-charcoal/50 text-taqon-charcoal dark:text-white text-sm rounded-xl px-4 py-2.5 border border-warm-200 dark:border-white/10 focus:border-taqon-orange focus:ring-0 min-h-[44px]"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Category Chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => updateFilter('category', '')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  !category ? 'bg-taqon-orange text-taqon-charcoal dark:text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                All ({courses.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => updateFilter('category', cat.category)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    category === cat.category
                      ? 'bg-taqon-orange text-taqon-charcoal dark:text-white'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {CATEGORY_ICONS[cat.category]} {CATEGORY_LABELS[cat.category] || cat.category} ({cat.count})
                </button>
              ))}
            </div>
          )}

          {/* Course Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
              <BookOpen size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Courses Found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/courses/${course.slug}`}
                    className="group block bg-white dark:bg-taqon-charcoal/50 rounded-2xl border border-warm-100 dark:border-white/5 hover:border-taqon-orange/30 transition-all overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="h-44 bg-gradient-to-br from-taqon-orange/20 to-taqon-charcoal relative overflow-hidden">
                      {course.display_thumbnail ? (
                        <img
                          src={course.display_thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">{CATEGORY_ICONS[course.category] || '☀️'}</span>
                        </div>
                      )}
                      {course.is_featured && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-taqon-orange text-taqon-charcoal dark:text-white text-xs font-bold rounded-full">
                          Featured
                        </span>
                      )}
                      <span className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold rounded-full ${DIFFICULTY_COLORS[course.difficulty]}`}>
                        {course.difficulty}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-taqon-orange font-semibold">
                          {CATEGORY_LABELS[course.category] || course.category}
                        </span>
                        {course.is_free ? (
                          <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-xs font-semibold rounded">
                            FREE
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">${course.price}</span>
                        )}
                      </div>

                      <h3 className="font-semibold text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {course.short_description || course.subtitle}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} /> {course.module_count} modules
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {course.estimated_duration_hours}h
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {course.average_rating > 0 && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Star size={12} fill="currentColor" /> {parseFloat(course.average_rating).toFixed(1)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {course.total_enrollments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
