import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, Clock, Star, CheckCircle, Warning,
  MapPin, CaretRight, Calendar, TrendUp,
  Wrench, Lightning, Shield, Timer,
} from '@phosphor-icons/react';
import { technicianApi } from '../../api/technician';
import SEO from '../../components/SEO';
import { DashboardKPISkeleton, SkeletonBox } from '../../components/Skeletons';

const STATUS_COLORS = {
  assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_route: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-taqon-orange/10 text-taqon-orange border-taqon-orange/20',
  on_hold: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const PRIORITY_COLORS = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

function StatCard({ icon: Icon, label, value, color = 'text-taqon-orange', subtitle }) {
  return (
    <div className="bg-white dark:bg-taqon-charcoal/50 rounded-2xl p-5 border border-warm-100 dark:border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function JobCard({ job }) {
  const statusColor = STATUS_COLORS[job.status] || 'bg-gray-500/10 text-gray-400';
  const priorityColor = PRIORITY_COLORS[job.priority] || 'text-gray-400';

  return (
    <Link
      to={`/technician/jobs/${job.job_number}`}
      className="group block bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5 hover:border-taqon-orange/30 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 font-mono">{job.job_number}</span>
            <span className={`text-xs font-semibold ${priorityColor}`}>
              {job.priority.toUpperCase()}
            </span>
          </div>
          <h4 className="font-semibold text-taqon-charcoal dark:text-white truncate group-hover:text-taqon-orange transition-colors">
            {job.title}
          </h4>
        </div>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusColor}`}>
          {job.status.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
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
          <Clock size={12} /> {job.estimated_duration_hours}h
        </span>
      </div>
    </Link>
  );
}

export default function TechnicianDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    technicianApi.getDashboard()
      .then(({ data }) => setData(data))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to load dashboard.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3 mb-8">
            <SkeletonBox className="h-7 w-48 rounded-lg" />
            <SkeletonBox className="h-4 w-64 rounded-md" />
          </div>
          <DashboardKPISkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <SkeletonBox className="h-72 rounded-2xl" />
            <SkeletonBox className="h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center pt-20">
        <div className="text-center">
          <Warning size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-taqon-charcoal dark:text-white mb-2">Dashboard Unavailable</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const { profile, active_jobs, upcoming_jobs, stats } = data;

  return (
    <>
      <SEO title="Technician Dashboard" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Technician Portal
            </span>
            <h1 className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white mt-2">
              Welcome back, {profile.user.first_name}
            </h1>
            <p className="text-gray-400 mt-1">
              {profile.employee_id} · {profile.skill_level.charAt(0).toUpperCase() + profile.skill_level.slice(1)} Technician
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Briefcase}
              label="Active Jobs"
              value={stats.active_jobs}
              color="text-blue-400"
              subtitle={`${stats.pending_today} scheduled today`}
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={stats.completed_this_month}
              color="text-green-400"
              subtitle="This month"
            />
            <StatCard
              icon={Star}
              label="Rating"
              value={stats.average_rating.toFixed(1)}
              color="text-yellow-400"
              subtitle={`${profile.total_ratings} reviews`}
            />
            <StatCard
              icon={Timer}
              label="On Time"
              value={`${stats.on_time_percentage}%`}
              color="text-emerald-400"
              subtitle="Punctuality rate"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <Link
              to="/technician/jobs"
              className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5 hover:border-taqon-orange/30 transition-all text-center"
            >
              <Wrench size={24} className="text-taqon-orange mx-auto mb-2" />
              <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">My Jobs</span>
            </Link>
            <Link
              to="/technician/jobs?status=assigned"
              className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5 hover:border-blue-500/30 transition-all text-center"
            >
              <Briefcase size={24} className="text-blue-400 mx-auto mb-2" />
              <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">Pending</span>
            </Link>
            <Link
              to="/technician/schedule"
              className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5 hover:border-purple-500/30 transition-all text-center"
            >
              <Calendar size={24} className="text-purple-400 mx-auto mb-2" />
              <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">Schedule</span>
            </Link>
            <Link
              to="/technician/profile"
              className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-4 border border-warm-100 dark:border-white/5 hover:border-green-500/30 transition-all text-center"
            >
              <Shield size={24} className="text-green-400 mx-auto mb-2" />
              <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">Profile</span>
            </Link>
          </div>

          {/* Active Jobs */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">Active Jobs</h2>
              <Link to="/technician/jobs" className="text-sm text-taqon-orange hover:underline flex items-center gap-1">
                View All <CaretRight size={14} />
              </Link>
            </div>
            {active_jobs.length === 0 ? (
              <div className="bg-white dark:bg-taqon-charcoal/30 rounded-xl p-8 text-center border border-warm-100 dark:border-white/5">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-gray-400">No active jobs. You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {active_jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Jobs */}
          {upcoming_jobs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-4">Upcoming This Week</h2>
              <div className="space-y-3">
                {upcoming_jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
