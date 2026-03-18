import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Camera, CircleNotch, FloppyDisk, Check,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import useAuthStore from '../../stores/authStore';
import SEO from '../../components/SEO';

const PROVINCES = [
  { value: 'bulawayo', label: 'Bulawayo' },
  { value: 'harare', label: 'Harare' },
  { value: 'manicaland', label: 'Manicaland' },
  { value: 'mashonaland_central', label: 'Mashonaland Central' },
  { value: 'mashonaland_east', label: 'Mashonaland East' },
  { value: 'mashonaland_west', label: 'Mashonaland West' },
  { value: 'masvingo', label: 'Masvingo' },
  { value: 'matabeleland_north', label: 'Matabeleland North' },
  { value: 'matabeleland_south', label: 'Matabeleland South' },
  { value: 'midlands', label: 'Midlands' },
];

export default function ProfileSettings() {
  const { user, fetchProfile } = useAuthStore();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    date_of_birth: user?.date_of_birth || '',
    address: user?.address || '',
    city: user?.city || '',
    province: user?.province || '',
    company_name: user?.company_name || '',
    account_type: user?.account_type || 'individual',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      await fetchProfile();
      toast.success('Profile updated successfully.');
    } catch (err) {
      const msg = err.response?.data;
      if (msg && typeof msg === 'object') {
        const first = Object.values(msg).flat()[0];
        toast.error(first || 'Failed to update profile.');
      } else {
        toast.error('Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB.'); return; }
    if (!file.type.startsWith('image/')) { toast.error('File must be an image.'); return; }

    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      await authApi.uploadAvatar(formData);
      await fetchProfile();
      toast.success('Avatar updated.');
    } catch {
      toast.error('Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <SEO title="Profile Settings" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/account" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Profile Settings</h1>
          </div>

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-5 mb-8"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-taqon-orange/10 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-taqon-orange" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-taqon-orange rounded-full flex items-center justify-center text-taqon-charcoal dark:text-white shadow-lg hover:bg-taqon-orange/90 transition-colors disabled:opacity-50"
              >
                {uploading ? <CircleNotch size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div>
              <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">{user?.email}</p>
              <p className="text-xs text-gray-500">
                {user?.is_verified ? 'Email verified' : 'Email not verified'} &middot; Joined {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Name */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">First Name</label>
                <input
                  name="first_name" value={form.first_name} onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Last Name</label>
                <input
                  name="last_name" value={form.last_name} onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Phone Number</label>
              <input
                name="phone_number" value={form.phone_number} onChange={handleChange}
                placeholder="+263XXXXXXXXX"
                className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Date of Birth</label>
              <input
                name="date_of_birth" type="date" value={form.date_of_birth || ''} onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Address</label>
              <input
                name="address" value={form.address} onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">City</label>
                <input
                  name="city" value={form.city} onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Province</label>
                <select
                  name="province" value={form.province} onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none"
                >
                  <option value="">Select Province</option>
                  {PROVINCES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Business */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Company Name</label>
                <input
                  name="company_name" value={form.company_name} onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Account Type</label>
                <select
                  name="account_type" value={form.account_type} onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-taqon-orange text-taqon-charcoal dark:text-white font-semibold rounded-lg hover:bg-taqon-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
              Save Changes
            </button>
          </motion.form>
        </div>
      </div>
    </>
  );
}
