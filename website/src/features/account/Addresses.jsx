import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Plus, Trash, CircleNotch, Star, X, PencilSimple, Check,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import SEO from '../../components/SEO';
import { OrderListSkeleton } from '../../components/Skeletons';

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

const EMPTY_FORM = {
  label: '', recipient_name: '', phone_number: '', address_line: '',
  city: '', province: '', postal_code: '', is_default: false,
};

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // address id or null
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchAddresses = async () => {
    try {
      const { data } = await authApi.getAddresses();
      setAddresses(data.results || data || []);
    } catch {
      toast.error('Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditing(addr.id);
    setForm({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone_number: addr.phone_number || '',
      address_line: addr.address_line,
      city: addr.city,
      province: addr.province,
      postal_code: addr.postal_code || '',
      is_default: addr.is_default,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await authApi.updateAddress(editing, form);
        toast.success('Address updated.');
      } else {
        await authApi.createAddress(form);
        toast.success('Address added.');
      }
      setShowForm(false);
      setEditing(null);
      await fetchAddresses();
    } catch (err) {
      const msg = err.response?.data;
      if (msg && typeof msg === 'object') {
        toast.error(Object.values(msg).flat()[0] || 'Failed to save address.');
      } else {
        toast.error('Failed to save address.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await authApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted.');
    } catch {
      toast.error('Failed to delete address.');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await authApi.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
      toast.success('Default address updated.');
    } catch {
      toast.error('Failed to update default address.');
    }
  };

  return (
    <>
      <SEO title="Saved Addresses" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/account" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Saved Addresses</h1>
            </div>
            {!showForm && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-taqon-orange text-taqon-charcoal dark:text-white rounded-lg hover:bg-taqon-orange/90 transition-colors"
              >
                <Plus size={14} /> Add Address
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-taqon-charcoal dark:text-white">
                  {editing ? 'Edit Address' : 'New Address'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-taqon-charcoal dark:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Label</label>
                    <input
                      name="label" value={form.label} onChange={handleChange} required
                      placeholder="e.g. Home, Office"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Recipient Name</label>
                    <input
                      name="recipient_name" value={form.recipient_name} onChange={handleChange} required
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                  <input
                    name="phone_number" value={form.phone_number} onChange={handleChange}
                    placeholder="+263XXXXXXXXX"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Address</label>
                  <input
                    name="address_line" value={form.address_line} onChange={handleChange} required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">City</label>
                    <input
                      name="city" value={form.city} onChange={handleChange} required
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Province</label>
                    <select
                      name="province" value={form.province} onChange={handleChange} required
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none"
                    >
                      <option value="">Select</option>
                      {PROVINCES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Postal Code</label>
                    <input
                      name="postal_code" value={form.postal_code} onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange}
                    className="w-4 h-4 rounded border-white/20 accent-taqon-orange"
                  />
                  <span className="text-xs text-gray-300">Set as default address</span>
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 text-xs font-semibold text-taqon-charcoal dark:text-white bg-taqon-orange rounded-lg hover:bg-taqon-orange/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <CircleNotch size={12} className="animate-spin" />}
                    {editing ? 'Update' : 'Save'} Address
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Address List */}
          {loading ? (
            <OrderListSkeleton count={3} />
          ) : addresses.length === 0 && !showForm ? (
            <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
              <MapPin size={40} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-400">No saved addresses</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Add addresses for faster checkout</p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-taqon-orange text-taqon-charcoal dark:text-white text-sm font-semibold rounded-lg hover:bg-taqon-orange/90 transition-colors"
              >
                <Plus size={14} /> Add Your First Address
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr, i) => (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white dark:bg-taqon-charcoal/40 rounded-xl border p-4 ${
                    addr.is_default ? 'border-taqon-orange/30' : 'border-warm-100 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-taqon-charcoal dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">
                        {addr.label}
                      </span>
                      {addr.is_default && (
                        <span className="text-[10px] font-bold text-taqon-orange bg-taqon-orange/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Star size={8} /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(addr)}
                        className="p-1.5 text-gray-500 hover:text-taqon-charcoal dark:text-white transition-colors"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        disabled={deleting === addr.id}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deleting === addr.id ? <CircleNotch size={14} className="animate-spin" /> : <Trash size={14} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-taqon-charcoal dark:text-white">{addr.recipient_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{addr.address_line}</p>
                  <p className="text-xs text-gray-400">{addr.city}, {PROVINCES.find((p) => p.value === addr.province)?.label || addr.province}{addr.postal_code ? `, ${addr.postal_code}` : ''}</p>
                  {addr.phone_number && <p className="text-xs text-gray-500 mt-0.5">{addr.phone_number}</p>}

                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="mt-2 text-xs text-taqon-orange hover:underline flex items-center gap-1"
                    >
                      <Check size={10} /> Set as default
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
