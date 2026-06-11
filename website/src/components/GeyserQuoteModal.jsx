import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, WhatsappLogo, Sun, Sparkle } from '@phosphor-icons/react';
import { TAQON_PHONE_INTL } from '../data/siteData';

const QUESTIONS = [
  { key: 'people', q: 'How many people use hot water?', options: ['1–2', '3–4', '5–6', '7+'] },
  { key: 'plumbing', q: 'What plumbing system do you have?', options: ['Pressure', 'Gravity', 'Not sure'] },
  { key: 'smart', q: 'Want intelligent temperature control?', options: ['Yes please', 'No', 'Not sure'] },
  { key: 'usage', q: 'How heavy is your hot-water usage?', options: ['Light', 'Moderate', 'Heavy'] },
];

function Chips({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${value === o
            ? 'bg-taqon-orange text-white border-taqon-orange'
            : 'bg-transparent text-taqon-dark/70 dark:text-white/70 border-black/10 dark:border-white/15 hover:border-taqon-orange/50'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

/**
 * A short geyser questionnaire that hands off to WhatsApp with the questions
 * and answers prefilled. `pkg` (optional) names the package they're enquiring
 * about and seeds plumbing/smart answers from it.
 */
export default function GeyserQuoteModal({ open, onClose, pkg = null }) {
  const [form, setForm] = useState(() => ({
    name: '', phone: '', area: '',
    people: '', usage: '', notes: '',
    plumbing: pkg ? (pkg.system_type === 'pressure' ? 'Pressure' : 'Gravity') : '',
    smart: pkg ? (pkg.is_smart ? 'Yes please' : 'No') : '',
  }));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const send = () => {
    const L = [];
    L.push("Hi Taqon Electrico, I'd like a quote for a solar geyser. 🌞", '');
    if (pkg) L.push(`*Package:* ${pkg.name}${pkg.price ? ` (~$${parseFloat(pkg.price).toLocaleString(undefined, { maximumFractionDigits: 0 })})` : ''}`);
    if (form.name) L.push(`*Name:* ${form.name}`);
    if (form.phone) L.push(`*Phone:* ${form.phone}`);
    if (form.area) L.push(`*Area:* ${form.area}`);
    if (form.people) L.push(`*People using hot water:* ${form.people}`);
    if (form.plumbing) L.push(`*Plumbing system:* ${form.plumbing}`);
    if (form.smart) L.push(`*Smart control:* ${form.smart}`);
    if (form.usage) L.push(`*Hot-water usage:* ${form.usage}`);
    if (form.notes) L.push(`*Notes:* ${form.notes}`);
    const url = `https://wa.me/${TAQON_PHONE_INTL}?text=${encodeURIComponent(L.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
    onClose();
  };

  const canSend = form.name.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-lg max-h-[90vh] flex flex-col bg-taqon-cream dark:bg-taqon-charcoal rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="relative px-6 py-5 bg-gradient-to-br from-taqon-orange to-[#FF8447] text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/15"><X size={18} /></button>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-90"><Sun size={13} weight="fill" /> Solar Geyser Quote</span>
              <h2 className="font-syne font-extrabold text-2xl mt-1">A few quick questions</h2>
              <p className="text-white/85 text-sm mt-1">Answer these and we'll open WhatsApp with everything filled in — just hit send.</p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {pkg && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-taqon-orange/10 border border-taqon-orange/20">
                  {pkg.is_smart ? <Sparkle size={18} className="text-taqon-orange" weight="fill" /> : <Sun size={18} className="text-taqon-orange" weight="fill" />}
                  <div>
                    <p className="text-sm font-semibold text-taqon-dark dark:text-white">{pkg.name}</p>
                    {pkg.price ? <p className="text-xs text-taqon-dark/55 dark:text-white/55">From ${parseFloat(pkg.price).toLocaleString(undefined, { maximumFractionDigits: 0 })} installed</p> : null}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-taqon-dark/60 dark:text-white/60 mb-1">Your name *</label>
                  <input className="auth-input w-full text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Tendai Moyo" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-taqon-dark/60 dark:text-white/60 mb-1">Phone (optional)</label>
                  <input className="auth-input w-full text-sm" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="077…" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-taqon-dark/60 dark:text-white/60 mb-1">Area / suburb (optional)</label>
                <input className="auth-input w-full text-sm" value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="e.g. Borrowdale, Harare" />
              </div>

              {QUESTIONS.map((qq) => (
                <div key={qq.key}>
                  <p className="text-sm font-medium text-taqon-dark dark:text-white mb-2">{qq.q}</p>
                  <Chips value={form[qq.key]} onChange={(v) => set(qq.key, v)} options={qq.options} />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-taqon-dark/60 dark:text-white/60 mb-1">Anything else? (optional)</label>
                <textarea rows={2} className="auth-input w-full text-sm resize-y" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Roof type, timeframe, questions…" />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-black/5 dark:border-white/10">
              <button onClick={send} disabled={!canSend}
                className="w-full px-5 py-3 rounded-xl bg-[#25D366] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <WhatsappLogo size={20} weight="fill" /> Send on WhatsApp
              </button>
              {!canSend && <p className="text-center text-[11px] text-taqon-dark/45 dark:text-white/45 mt-2">Add your name to continue</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
