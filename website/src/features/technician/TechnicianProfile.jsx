import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Shield, MapPin, Star, Trophy,
  CircleNotch, FloppyDisk, Phone, EnvelopeSimple, Briefcase,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { technicianApi } from '../../api/technician';
import SEO from '../../components/SEO';
import { DetailPageSkeleton } from '../../components/Skeletons';

const SKILL_LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
];

const SPECIALIZATION_OPTIONS = [
  'installation', 'maintenance', 'repair', 'inspection',
  'battery', 'inverter', 'panel', 'electrical', 'borehole',
];

export default function TechnicianProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [bio, setBio] = useState('');
  const [baseLocation, setBaseLocation] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [maxJobs, setMaxJobs] = useState(3);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  useEffect(() => {
    technicianApi.getProfile()
      .then(({ data }) => {
        setProfile(data);
        setBio(data.bio || '');
        setBaseLocation(data.base_location || '');
        setIsAvailable(data.is_available);
        setMaxJobs(data.max_concurrent_jobs);
        setEmergencyName(data.emergency_contact_name || '');
        setEmergencyPhone(data.emergency_contact_phone || '');
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await technicianApi.updateProfile({
        bio,
        base_location: baseLocation,
        is_available: isAvailable,
        max_concurrent_jobs: maxJobs,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
      });
      setProfile(data);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DetailPageSkeleton />;

  if (!profile) return null;

  return (
    <>
      <SEO title="Technician Profile" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/technician" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">My Profile</h1>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-taqon-charcoal/50 rounded-2xl p-6 border border-warm-100 dark:border-white/5 mb-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-taqon-orange/20 flex items-center justify-center">
                <User size={28} className="text-taqon-orange" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-taqon-charcoal dark:text-white">{profile.user.first_name} {profile.user.last_name}</h2>
                <p className="text-sm text-gray-400">{profile.employee_id} · {profile.skill_level} Technician</p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <EnvelopeSimple size={12} /> {profile.user.email}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Briefcase size={18} className="text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-taqon-charcoal dark:text-white">{profile.total_jobs_completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Star size={18} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-taqon-charcoal dark:text-white">{parseFloat(profile.average_rating).toFixed(1)}</p>
                <p className="text-xs text-gray-500">{profile.total_ratings} ratings</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Trophy size={18} className="text-green-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-taqon-charcoal dark:text-white">{parseFloat(profile.on_time_percentage).toFixed(0)}%</p>
                <p className="text-xs text-gray-500">On Time</p>
              </div>
            </div>
          </motion.div>

          {/* Specializations */}
          {profile.specializations?.length > 0 && (
            <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5 mb-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {profile.specializations.map((s) => (
                  <span key={s} className="px-3 py-1 bg-taqon-orange/10 text-taqon-orange text-xs font-semibold rounded-full capitalize">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile.certifications?.length > 0 && (
            <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5 mb-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Certifications</h3>
              <div className="space-y-2">
                {profile.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Shield size={14} className="text-green-400" />
                    <span className="text-sm text-taqon-charcoal dark:text-white">{cert.name || cert}</span>
                    {cert.year && <span className="text-xs text-gray-500">({cert.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editable Fields */}
          <div className="bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5 mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-taqon-orange focus:ring-0"
                  placeholder="Brief professional summary..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Base Location</label>
                <input
                  type="text"
                  value={baseLocation}
                  onChange={(e) => setBaseLocation(e.target.value)}
                  className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-taqon-orange focus:ring-0"
                  placeholder="e.g. Harare CBD"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Availability</label>
                  <select
                    value={isAvailable ? 'true' : 'false'}
                    onChange={(e) => setIsAvailable(e.target.value === 'true')}
                    className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Max Concurrent Jobs</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxJobs}
                    onChange={(e) => setMaxJobs(parseInt(e.target.value) || 3)}
                    className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-taqon-orange focus:ring-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-taqon-orange focus:ring-0"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-taqon-orange focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <CircleNotch size={18} className="animate-spin" /> : <FloppyDisk size={18} />}
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
