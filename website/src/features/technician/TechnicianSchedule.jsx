import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, CaretLeft, CaretRight, Plus,
  CircleNotch, Clock, MapPin, Briefcase, X, Trash,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { technicianApi } from '../../api/technician';
import SEO from '../../components/SEO';
import { SkeletonBox } from '../../components/Skeletons';

const SCHEDULE_TYPES = [
  { value: 'available', label: 'Available', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'unavailable', label: 'Unavailable', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { value: 'leave', label: 'On Leave', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'training', label: 'Training', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
];

const JOB_STATUS_COLORS = {
  assigned: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  en_route: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  in_progress: 'bg-taqon-orange/20 border-taqon-orange/30 text-taqon-orange',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function TechnicianSchedule() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [scheduleData, setScheduleData] = useState({ schedule: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Add form state
  const [formType, setFormType] = useState('unavailable');
  const [formDate, setFormDate] = useState('');
  const [formAllDay, setFormAllDay] = useState(true);
  const [formStart, setFormStart] = useState('08:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [currentMonth, currentYear]);

  const loadSchedule = async () => {
    setLoading(true);
    const dateFrom = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const dateTo = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${daysInMonth}`;

    try {
      const { data } = await technicianApi.getSchedule({ date_from: dateFrom, date_to: dateTo });
      setScheduleData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Build calendar data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, day: 0 });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySchedule = scheduleData.schedule.filter((s) => s.date === dateStr);
      const dayJobs = scheduleData.jobs.filter((j) => j.scheduled_date === dateStr);
      days.push({ date: dateStr, day, schedule: daySchedule, jobs: dayJobs });
    }

    return days;
  }, [currentYear, currentMonth, scheduleData]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return calendarDays.find((d) => d.date === selectedDate);
  }, [selectedDate, calendarDays]);

  const handleAddEntry = async () => {
    if (!formDate) {
      toast.error('Please select a date.');
      return;
    }
    setSubmitting(true);
    try {
      await technicianApi.createScheduleEntry({
        schedule_type: formType,
        date: formDate,
        is_all_day: formAllDay,
        start_time: formAllDay ? null : formStart,
        end_time: formAllDay ? null : formEnd,
        notes: formNotes,
      });
      toast.success('Schedule entry added.');
      setShowAddForm(false);
      setFormNotes('');
      loadSchedule();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await technicianApi.deleteScheduleEntry(id);
      toast.success('Entry removed.');
      loadSchedule();
    } catch (err) {
      toast.error('Failed to delete entry.');
    }
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <>
      <SEO title="My Schedule" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/technician" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">My Schedule</h1>
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormDate(selectedDate || todayStr);
              }}
              className="px-4 py-2 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Add Entry
            </button>
          </div>

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-taqon-charcoal dark:text-white">Add Schedule Entry</h3>
                    <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-taqon-charcoal dark:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm"
                      >
                        {SCHEDULE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formAllDay}
                          onChange={(e) => setFormAllDay(e.target.checked)}
                          className="rounded border-white/20 bg-taqon-cream dark:bg-taqon-dark text-taqon-orange focus:ring-taqon-orange"
                        />
                        All Day
                      </label>
                      {!formAllDay && (
                        <>
                          <input
                            type="time"
                            value={formStart}
                            onChange={(e) => setFormStart(e.target.value)}
                            className="bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={formEnd}
                            onChange={(e) => setFormEnd(e.target.value)}
                            className="bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm"
                          />
                        </>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-400 block mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm"
                        placeholder="e.g. Doctor appointment"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddEntry}
                    disabled={submitting}
                    className="mt-4 px-6 py-2 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <CircleNotch size={14} className="animate-spin" /> : <Plus size={14} />}
                    Save Entry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <CaretLeft size={20} className="text-gray-400" />
                </button>
                <h2 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">{monthName}</h2>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <CaretRight size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs text-gray-500 font-semibold py-2">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              {loading ? (
                <div className="grid grid-cols-7 gap-1 py-4">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <SkeletonBox key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, i) => {
                    if (!cell.date) {
                      return <div key={`empty-${i}`} className="aspect-square" />;
                    }

                    const isToday = cell.date === todayStr;
                    const isSelected = cell.date === selectedDate;
                    const hasSchedule = cell.schedule?.length > 0;
                    const hasJobs = cell.jobs?.length > 0;

                    return (
                      <button
                        key={cell.date}
                        onClick={() => setSelectedDate(cell.date)}
                        className={`aspect-square rounded-lg p-1 text-left transition-all relative ${
                          isSelected
                            ? 'bg-taqon-orange/20 border border-taqon-orange/40'
                            : isToday
                            ? 'bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className={`text-xs font-semibold ${isToday ? 'text-taqon-orange' : 'text-gray-400'}`}>
                          {cell.day}
                        </span>
                        <div className="flex gap-0.5 mt-0.5 flex-wrap">
                          {hasJobs && cell.jobs.map((_, ji) => (
                            <div key={ji} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          ))}
                          {hasSchedule && cell.schedule.map((s, si) => (
                            <div
                              key={si}
                              className={`w-1.5 h-1.5 rounded-full ${
                                s.schedule_type === 'unavailable' || s.schedule_type === 'leave'
                                  ? 'bg-red-400'
                                  : s.schedule_type === 'training'
                                  ? 'bg-purple-400'
                                  : 'bg-green-400'
                              }`}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Jobs</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /> Available</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Unavailable</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400" /> Training</span>
              </div>
            </div>

            {/* Day Detail Sidebar */}
            <div>
              {selectedDate && selectedDayData ? (
                <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5 sticky top-24">
                  <h3 className="font-semibold text-taqon-charcoal dark:text-white mb-4">
                    {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })}
                  </h3>

                  {/* Jobs for this day */}
                  {selectedDayData.jobs?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Jobs</h4>
                      <div className="space-y-2">
                        {selectedDayData.jobs.map((job) => (
                          <Link
                            key={job.job_number}
                            to={`/technician/jobs/${job.job_number}`}
                            className={`block p-3 rounded-lg border ${JOB_STATUS_COLORS[job.status] || 'bg-gray-50 dark:bg-white/5 border-warm-200 dark:border-white/10 text-gray-300'}`}
                          >
                            <p className="font-semibold text-sm">{job.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs opacity-80">
                              {job.scheduled_time_start && (
                                <span className="flex items-center gap-1">
                                  <Clock size={10} /> {job.scheduled_time_start}
                                </span>
                              )}
                              {job.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={10} /> {job.city}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule entries */}
                  {selectedDayData.schedule?.length > 0 && (
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Schedule</h4>
                      <div className="space-y-2">
                        {selectedDayData.schedule.map((entry) => {
                          const typeInfo = SCHEDULE_TYPES.find((t) => t.value === entry.schedule_type);
                          return (
                            <div key={entry.id} className={`p-3 rounded-lg border ${typeInfo?.color || 'bg-gray-50 dark:bg-white/5 border-warm-200 dark:border-white/10 text-gray-300'}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{typeInfo?.label}</span>
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  className="text-gray-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash size={14} />
                                </button>
                              </div>
                              {!entry.is_all_day && entry.start_time && (
                                <p className="text-xs opacity-80 mt-1">{entry.start_time} – {entry.end_time}</p>
                              )}
                              {entry.notes && <p className="text-xs opacity-70 mt-1">{entry.notes}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(!selectedDayData.jobs?.length && !selectedDayData.schedule?.length) && (
                    <p className="text-sm text-gray-500">No events for this day.</p>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-taqon-charcoal/30 rounded-xl p-8 border border-warm-100 dark:border-white/5 text-center">
                  <Calendar size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Select a day to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
