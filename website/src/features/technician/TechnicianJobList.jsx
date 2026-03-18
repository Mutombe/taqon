import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, Clock, MapPin, Calendar, CaretRight,
  MagnifyingGlass, Funnel, ArrowLeft,
} from '@phosphor-icons/react';
import { technicianApi } from '../../api/technician';
import SEO from '../../components/SEO';
import { OrderListSkeleton } from '../../components/Skeletons';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'en_route', label: 'En Route' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'installation', label: 'Installation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'repair', label: 'Repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'consultation', label: 'Consultation' },
];

const STATUS_COLORS = {
  unassigned: 'bg-gray-500/10 text-gray-400',
  assigned: 'bg-blue-500/10 text-blue-400',
  en_route: 'bg-yellow-500/10 text-yellow-400',
  in_progress: 'bg-taqon-orange/10 text-taqon-orange',
  on_hold: 'bg-red-500/10 text-red-400',
  completed: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-gray-500/10 text-gray-500',
};

const PRIORITY_BADGES = {
  low: 'bg-gray-500/10 text-gray-400',
  medium: 'bg-blue-500/10 text-blue-400',
  high: 'bg-orange-500/10 text-orange-400',
  urgent: 'bg-red-500/10 text-red-400',
};

export default function TechnicianJobList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusFilter = searchParams.get('status') || '';
  const typeFilter = searchParams.get('type') || '';
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await technicianApi.getJobs(params);
      setJobs(data.results || data);
      if (data.count) setTotalPages(Math.ceil(data.count / PAGE_SIZE));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [statusFilter, typeFilter, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { setPage(1); }, [statusFilter, typeFilter]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  return (
    <>
      <SEO title="My Jobs" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/technician" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">My Jobs</h1>
              <p className="text-sm text-gray-400">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="bg-white dark:bg-taqon-charcoal/50 text-taqon-charcoal dark:text-white text-sm rounded-xl px-4 py-2.5 border border-warm-200 dark:border-white/10 focus:border-taqon-orange focus:ring-0 min-h-[44px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="bg-white dark:bg-taqon-charcoal/50 text-taqon-charcoal dark:text-white text-sm rounded-xl px-4 py-2.5 border border-warm-200 dark:border-white/10 focus:border-taqon-orange focus:ring-0 min-h-[44px]"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Job List */}
          {loading ? (
            <OrderListSkeleton count={5} />
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
              <Briefcase size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Jobs Found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
            <div className="space-y-3">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={`/technician/jobs/${job.job_number}`}
                    className="group block bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5 hover:border-taqon-orange/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-mono">{job.job_number}</span>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_BADGES[job.priority]}`}>
                            {job.priority}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-50 dark:bg-white/5 text-gray-400">
                            {job.job_type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors">
                          {job.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[job.status]}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        <CaretRight size={16} className="text-gray-600 group-hover:text-taqon-orange transition-colors" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {job.customer_name && (
                        <span>{job.customer_name}</span>
                      )}
                      {job.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {job.scheduled_date}
                        </span>
                      )}
                      {job.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {job.city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {job.estimated_duration_hours}h est.
                      </span>
                      {job.customer_rating && (
                        <span className="text-yellow-400">★ {job.customer_rating}</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </>
          )}
        </div>
      </div>
    </>
  );
}
