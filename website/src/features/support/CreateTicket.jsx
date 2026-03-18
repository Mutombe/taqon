import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, PaperPlaneTilt, CircleNotch, WarningCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supportApi } from '../../api/support';
import SEO from '../../components/SEO';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'sales', label: 'Sales' },
  { value: 'technical_support', label: 'Technical Support' },
  { value: 'billing', label: 'Billing' },
  { value: 'installation', label: 'Installation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'complaint', label: 'Complaint' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', desc: 'General questions' },
  { value: 'medium', label: 'Medium', desc: 'Needs attention soon' },
  { value: 'high', label: 'High', desc: 'Affecting operations' },
  { value: 'urgent', label: 'Urgent', desc: 'Critical issue' },
];

const PRIORITY_COLORS = {
  low: 'border-gray-500/30 hover:border-gray-400',
  medium: 'border-blue-500/30 hover:border-blue-400',
  high: 'border-orange-500/30 hover:border-orange-400',
  urgent: 'border-red-500/30 hover:border-red-400',
};

const PRIORITY_ACTIVE = {
  low: 'border-gray-400 bg-gray-500/10',
  medium: 'border-blue-400 bg-blue-500/10',
  high: 'border-orange-400 bg-orange-500/10',
  urgent: 'border-red-400 bg-red-500/10',
};

export default function CreateTicket() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await supportApi.createTicket({
        subject, category, priority, message,
      });
      toast.success(`Ticket ${data.ticket_number} created!`);
      navigate(`/support/tickets/${data.ticket_number}`);
    } catch {
      toast.error('Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Create Support Ticket" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/support/tickets" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Create Support Ticket</h1>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Subject */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe your issue..."
                className="w-full bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-xl px-4 py-3 text-taqon-charcoal dark:text-white focus:border-taqon-orange focus:ring-0"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-xl px-4 py-3 text-taqon-charcoal dark:text-white focus:border-taqon-orange focus:ring-0"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">Priority</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      priority === p.value ? PRIORITY_ACTIVE[p.value] : PRIORITY_COLORS[p.value]
                    }`}
                  >
                    <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Describe your issue in detail. Include order numbers, error messages, or any relevant information..."
                className="w-full bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-xl px-4 py-3 text-taqon-charcoal dark:text-white focus:border-taqon-orange focus:ring-0 resize-none"
                required
              />
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
              <WarningCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Our support team typically responds within 24 hours. For urgent matters,
                call us directly at <strong className="text-taqon-charcoal dark:text-white">+263 772 771 036</strong>.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <CircleNotch size={18} className="animate-spin" /> : <PaperPlaneTilt size={18} />}
              Submit Ticket
            </button>
          </motion.form>
        </div>
      </div>
    </>
  );
}
