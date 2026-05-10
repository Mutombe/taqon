import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Envelope, Phone, MapPin, ChatCircle, MagnifyingGlass, Funnel,
  CaretRight, X, ArrowSquareOut, SpinnerGap, FileText, WhatsappLogo,
  CheckCircle, Clock,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { inquiriesApi } from '../../api/inquiries';
import { SkeletonBox } from '../../components/Skeletons';

const STATUS_CHOICES = [
  { value: 'new',       label: 'New',       tone: 'orange' },
  { value: 'contacted', label: 'Contacted', tone: 'blue' },
  { value: 'quoted',    label: 'Quoted',    tone: 'violet' },
  { value: 'won',       label: 'Won',       tone: 'emerald' },
  { value: 'lost',      label: 'Lost',      tone: 'gray' },
  { value: 'archived',  label: 'Archived',  tone: 'gray' },
];

const TONE_STYLES = {
  orange: 'bg-taqon-orange/10 text-taqon-orange',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  emerald:'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  gray:   'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/55',
};

export default function AdminInquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await inquiriesApi.adminList(params);
      setItems(res.data?.results || res.data || []);
    } catch {
      toast.error('Could not load inquiries');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const map = STATUS_CHOICES.reduce((acc, s) => ({ ...acc, [s.value]: 0 }), {});
    items.forEach((i) => { if (map[i.status] !== undefined) map[i.status]++; });
    return map;
  }, [items]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <SEO title="Inquiries · Admin" />

      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
            <ChatCircle size={20} weight="duotone" className="text-taqon-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Inquiries
            </h1>
            <p className="text-sm text-taqon-muted dark:text-white/50">
              Customer recommendations & quote requests submitted via the public form.
            </p>
          </div>
        </div>
      </header>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterPill
          label="All"
          count={items.length}
          active={!statusFilter}
          onClick={() => setStatusFilter('')}
        />
        {STATUS_CHOICES.map((s) => (
          <FilterPill
            key={s.value}
            label={s.label}
            count={counts[s.value]}
            active={statusFilter === s.value}
            tone={s.tone}
            onClick={() => setStatusFilter(s.value)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, area..."
          className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (<SkeletonBox key={i} className="h-16" />))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-4">
            <ChatCircle size={26} weight="duotone" className="text-taqon-orange" />
          </div>
          <p className="text-base font-semibold text-taqon-charcoal dark:text-white">No inquiries here.</p>
          <p className="text-sm text-taqon-muted dark:text-white/45 mt-1">
            Customer submissions land here in real time. Share <code className="text-xs bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">/get-recommendation</code> with anyone who wants a quote.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
          {items.map((it, i) => (
            <InquiryRow
              key={it.id}
              inquiry={it}
              divider={i < items.length - 1}
              onOpen={() => setActive(it)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {active && (
          <DetailDrawer
            id={active.id}
            onClose={() => setActive(null)}
            onChanged={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterPill({ label, count, active, tone = 'gray', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
        active
          ? 'bg-taqon-orange text-white border-taqon-orange shadow-sm shadow-taqon-orange/20'
          : `${TONE_STYLES[tone]} border-transparent hover:border-gray-200 dark:hover:border-white/15`
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-[10px] tabular-nums px-1.5 rounded-full ${active ? 'bg-white/25' : 'bg-black/5 dark:bg-white/15'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function InquiryRow({ inquiry, divider, onOpen }) {
  const status = STATUS_CHOICES.find((s) => s.value === inquiry.status) || STATUS_CHOICES[0];
  const created = new Date(inquiry.created_at);
  const ago = relativeTime(created);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
        divider ? 'border-b border-gray-100 dark:border-white/10' : ''
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-taqon-orange">
          {(inquiry.name || '?').slice(0, 1).toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center">
        <div className="sm:col-span-4 min-w-0">
          <p className="font-semibold text-taqon-charcoal dark:text-white text-sm truncate">{inquiry.name}</p>
          <p className="text-xs text-taqon-muted dark:text-white/45 truncate">{inquiry.email}</p>
        </div>
        <div className="sm:col-span-3 min-w-0 text-xs text-taqon-charcoal/75 dark:text-white/55">
          {inquiry.area ? (
            <span className="inline-flex items-center gap-1"><MapPin size={11} weight="duotone" />{inquiry.area}</span>
          ) : (
            <span className="text-taqon-muted/60">No area</span>
          )}
        </div>
        <div className="sm:col-span-2 text-xs text-taqon-charcoal/75 dark:text-white/55 tabular-nums">
          {inquiry.appliance_count > 0 ? `${inquiry.appliance_count} item${inquiry.appliance_count > 1 ? 's' : ''}` : '—'}
        </div>
        <div className="sm:col-span-2 text-xs text-taqon-muted dark:text-white/45 tabular-nums">
          <Clock size={11} weight="duotone" className="inline mr-1" />{ago}
        </div>
        <div className="sm:col-span-1 flex items-center justify-end gap-2">
          <span className={`hidden sm:inline-flex text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${TONE_STYLES[status.tone]}`}>
            {status.label}
          </span>
          <CaretRight size={14} className="text-taqon-muted shrink-0" />
        </div>
      </div>
    </button>
  );
}

function DetailDrawer({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    inquiriesApi.adminDetail(id)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setAdminNotes(res.data?.admin_notes || '');
      })
      .catch(() => toast.error('Could not load inquiry'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const updateStatus = async (newStatus) => {
    setSaving(true);
    try {
      const res = await inquiriesApi.adminUpdate(id, { status: newStatus });
      setData(res.data);
      toast.success('Status updated');
      onChanged?.();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const res = await inquiriesApi.adminUpdate(id, { admin_notes: adminNotes });
      setData(res.data);
      toast.success('Notes saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.aside
        initial={{ x: 360 }}
        animate={{ x: 0 }}
        exit={{ x: 360 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-white dark:bg-taqon-charcoal h-full overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white dark:bg-taqon-charcoal border-b border-gray-100 dark:border-white/10 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold font-syne text-taqon-charcoal dark:text-white">Inquiry detail</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
            <X size={18} className="text-taqon-muted" />
          </button>
        </div>

        {loading || !data ? (
          <div className="p-5 space-y-3">
            {[0, 1, 2].map((i) => (<SkeletonBox key={i} className="h-16" />))}
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Identity */}
            <div>
              <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">{data.name}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                <a href={`mailto:${data.email}`} className="inline-flex items-center gap-2 text-taqon-charcoal/85 dark:text-white/75 hover:text-taqon-orange transition-colors">
                  <Envelope size={14} weight="duotone" /> {data.email}
                </a>
                {data.phone && (
                  <a href={`tel:${data.phone}`} className="inline-flex items-center gap-2 text-taqon-charcoal/85 dark:text-white/75 hover:text-taqon-orange transition-colors">
                    <Phone size={14} weight="duotone" /> {data.phone}
                  </a>
                )}
                {data.area && (
                  <span className="inline-flex items-center gap-2 text-taqon-charcoal/75 dark:text-white/65">
                    <MapPin size={14} weight="duotone" /> {data.area}{data.distance_km ? ` · ${data.distance_km} km` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              {data.phone && (
                <a
                  href={`https://wa.me/${data.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${data.name.split(' ')[0]}, this is Taqon Electrico following up on your inquiry.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-semibold transition-all"
                >
                  <WhatsappLogo size={14} weight="fill" /> WhatsApp
                </a>
              )}
              <a
                href={`mailto:${data.email}?subject=${encodeURIComponent('Your solar inquiry — Taqon Electrico')}`}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-taqon-orange hover:bg-taqon-orange/90 text-white text-xs font-semibold transition-all"
              >
                <Envelope size={14} weight="fill" /> Email reply
              </a>
            </div>

            {/* Demand */}
            <Section title="Demand">
              {data.monthly_grid_bill && (
                <Row label="Monthly bill">USD {data.monthly_grid_bill}</Row>
              )}
              {Array.isArray(data.appliances) && data.appliances.length > 0 && (
                <Row label="Appliances">
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {data.appliances.map((a, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider font-semibold bg-taqon-orange/10 text-taqon-orange px-2 py-0.5 rounded-full">
                        {(a.name || a.key || 'item')}{a.quantity > 1 ? ` × ${a.quantity}` : ''}
                      </span>
                    ))}
                  </div>
                </Row>
              )}
              {data.message && (
                <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-taqon-muted dark:text-white/45 mb-1.5">Customer notes</p>
                  <p className="text-sm text-taqon-charcoal dark:text-white/85 whitespace-pre-line leading-relaxed">{data.message}</p>
                </div>
              )}
            </Section>

            {/* Triage */}
            <Section title="Triage">
              <div className="flex flex-wrap gap-2">
                {STATUS_CHOICES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateStatus(s.value)}
                    disabled={saving || data.status === s.value}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
                      data.status === s.value
                        ? 'bg-taqon-orange text-white border-taqon-orange'
                        : `${TONE_STYLES[s.tone]} border-transparent hover:border-gray-200 dark:hover:border-white/15`
                    } disabled:opacity-50`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-taqon-muted dark:text-white/45 mb-1.5">
                  Internal notes
                </label>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Triage notes — never shown to the customer."
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white focus:ring-2 focus:ring-taqon-orange/15 focus:border-taqon-orange outline-none"
                />
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={saving || adminNotes === (data.admin_notes || '')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/15 text-taqon-charcoal dark:text-white/85 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
                >
                  {saving ? <SpinnerGap size={12} className="animate-spin" /> : <CheckCircle size={12} weight="fill" />}
                  Save notes
                </button>
              </div>
            </Section>

            {/* Meta */}
            <Section title="Meta">
              <Row label="Source">{data.source}</Row>
              <Row label="Received">{new Date(data.created_at).toLocaleString()}</Row>
            </Section>

            <Link
              to="/solar-advisor"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-taqon-charcoal dark:bg-white/10 text-white text-sm font-semibold mt-2"
            >
              <FileText size={14} weight="fill" /> Generate a quote
              <ArrowSquareOut size={12} />
            </Link>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-taqon-orange mb-2">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-taqon-muted dark:text-white/45 min-w-[88px]">{label}</span>
      <span className="text-sm text-taqon-charcoal dark:text-white/85 flex-1 min-w-0">{children}</span>
    </div>
  );
}

function relativeTime(d) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
