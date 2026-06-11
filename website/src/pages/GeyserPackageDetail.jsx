import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Sun, Sparkle, Check, ArrowLeft, ArrowRight, SpinnerGap, Drop, FilePdf,
} from '@phosphor-icons/react';
import SEO from '../components/SEO';
import { geysersApi } from '../api/geysers';
import { openGeyserQuote } from '../lib/geyserQuote';
import GeyserQuoteModal from '../components/GeyserQuoteModal';

const fmt = (v) => `$${parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const heroImg = (p) => p?.image_url || `/geysers/solar-geyser-0${((p?.capacity_litres || 100) / 100) % 9 + 1}.jpg`;

export default function GeyserPackageDetail() {
  const { slug } = useParams();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const { data: p, isLoading, isError } = useQuery({
    queryKey: ['geyserPackage', slug],
    queryFn: () => geysersApi.getPackage(slug).then((r) => r.data),
    retry: false,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center"><SpinnerGap size={34} className="animate-spin text-taqon-orange" /></div>;
  }
  if (isError || !p) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-taqon-dark/60 dark:text-white/60">That geyser package couldn't be found.</p>
        <Link to="/solar-geysers" className="text-taqon-orange font-semibold hover:underline">← All geyser packages</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark">
      <SEO
        title={`${p.name} | Solar Geyser`}
        description={p.short_description || p.description}
        keywords={`${p.name}, ${p.capacity_litres}L solar geyser Zimbabwe, ${p.system_type} solar geyser, ${p.brand} solar geyser, solar water heater Harare price`}
        image={heroImg(p)}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-12">
        <Link to="/solar-geysers" className="inline-flex items-center gap-1.5 text-sm text-taqon-dark/60 dark:text-white/60 hover:text-taqon-orange mb-6">
          <ArrowLeft size={15} /> All geyser packages
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-black/5">
            <img src={heroImg(p)} alt={p.name} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full backdrop-blur ${p.system_type === 'pressure' ? 'bg-blue-500/80 text-white' : 'bg-emerald-500/80 text-white'}`}>
                {p.system_type === 'pressure' ? 'Pressure' : 'Gravity'}
              </span>
              {p.is_smart && <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-taqon-orange text-white flex items-center gap-1"><Sparkle size={11} weight="fill" /> Smart</span>}
            </div>
          </motion.div>

          {/* Summary */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-taqon-orange">
              <Sun size={14} weight="fill" /> Solar Geyser · {p.brand}
            </span>
            <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-taqon-dark dark:text-white mt-2">{p.name}</h1>
            <p className="text-taqon-dark/65 dark:text-white/65 mt-3">{p.description}</p>

            <div className="mt-6 p-5 rounded-2xl bg-white dark:bg-taqon-charcoal border border-black/5 dark:border-white/10">
              <p className="text-xs text-taqon-dark/40 dark:text-white/40 uppercase tracking-wide">Fully installed price</p>
              <p className="font-syne font-extrabold text-4xl text-taqon-orange mt-1">{fmt(p.price)}</p>
              <p className="text-xs text-taqon-dark/50 dark:text-white/50 mt-1">
                Includes equipment, plumbing, mounting & professional installation within {parseFloat(p.distance_km)} km of Harare ($0.65/km beyond).
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <button onClick={() => setQuoteOpen(true)} className="flex-1 min-w-[150px] px-5 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-center hover:bg-taqon-orange/90 transition-colors flex items-center justify-center gap-2">
                  Request a quote <ArrowRight size={16} />
                </button>
                <button onClick={() => openGeyserQuote(p)} className="px-5 py-3 rounded-xl border border-black/10 dark:border-white/15 text-taqon-dark dark:text-white font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                  <FilePdf size={16} /> Download quotation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* What's included + specs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
          <div className="lg:col-span-2 bg-white dark:bg-taqon-charcoal border border-black/5 dark:border-white/10 rounded-3xl p-6">
            <h2 className="font-syne font-bold text-lg text-taqon-dark dark:text-white mb-4">What's included</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(p.whats_included || []).map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <Check size={18} className="text-taqon-orange flex-shrink-0 mt-0.5" weight="bold" />
                  <span className="text-sm text-taqon-dark/75 dark:text-white/75">{item}</span>
                </div>
              ))}
            </div>

            {p.features?.length > 0 && (
              <>
                <h2 className="font-syne font-bold text-lg text-taqon-dark dark:text-white mt-8 mb-4">Why you'll love it</h2>
                <div className="space-y-2.5">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      {p.is_smart && /schedul|temperature|intelligent|savings|comfort/i.test(f)
                        ? <Sparkle size={17} className="text-taqon-orange flex-shrink-0 mt-0.5" weight="fill" />
                        : <Drop size={17} className="text-taqon-orange flex-shrink-0 mt-0.5" weight="duotone" />}
                      <span className="text-sm text-taqon-dark/75 dark:text-white/75">{f}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Specs */}
          <div className="bg-white dark:bg-taqon-charcoal border border-black/5 dark:border-white/10 rounded-3xl p-6 h-fit">
            <h2 className="font-syne font-bold text-lg text-taqon-dark dark:text-white mb-4">Specifications</h2>
            <dl className="divide-y divide-black/5 dark:divide-white/10">
              {Object.entries(p.specifications || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2.5">
                  <dt className="text-sm text-taqon-dark/50 dark:text-white/50">{k}</dt>
                  <dd className="text-sm font-medium text-taqon-dark dark:text-white text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl bg-taqon-dark dark:bg-taqon-charcoal p-8 sm:p-10 text-center">
          <h3 className="font-syne font-extrabold text-2xl text-white">Ready for free hot water?</h3>
          <p className="text-white/60 mt-2 max-w-xl mx-auto">Request a quote for the {p.name} and our team will confirm pricing for your site and arrange installation.</p>
          <button onClick={() => setQuoteOpen(true)} className="inline-flex items-center gap-2 mt-6 px-7 py-3 rounded-full bg-taqon-orange text-white font-semibold hover:bg-taqon-orange/90 transition-colors">
            Request a quote <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <GeyserQuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} pkg={p} />
    </div>
  );
}
