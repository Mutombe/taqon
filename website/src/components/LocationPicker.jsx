import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MapPin, MagnifyingGlass, CaretDown, X, Truck, Check, Storefront } from '@phosphor-icons/react';
import {
  ZIMBABWE_AREAS,
  groupAreasByProvince,
  calculateDeliveryFee,
  DELIVERY_PRICING,
} from '../data/zimbabweAreas';

/**
 * Searchable, grouped location picker driven by ZIMBABWE_AREAS.
 *
 * Each row renders the area name on the left and either the distance
 * or the computed delivery fee on the right — so customers can scan
 * the price impact while choosing.
 *
 * Props:
 *   value       — selected area name string, or 'pickup', or '' / null
 *   onChange    — fn({ name, distance, province, deliveryFee, isPickup })
 *   showPrice   — when true (default), rows show the USD delivery fee
 *                 instead of just kilometres
 *   allowPickup — when true (default), the first row is "Free pickup
 *                 from HQ"; selecting it sets isPickup=true and
 *                 deliveryFee=0
 *   pricing     — { baseFee, perKm } override for the fee calc
 *   className   — wrapper class for layout integration
 */
export default function LocationPicker({
  value,
  onChange,
  showPrice = true,
  allowPickup = true,
  pricing = DELIVERY_PRICING,
  className = '',
  placeholder = 'Select your area',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  const groups = useMemo(() => groupAreasByProvince(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    const out = [];
    for (const [province, areas] of groups) {
      const match = areas.filter((a) =>
        a.name.toLowerCase().includes(q) || province.toLowerCase().includes(q),
      );
      if (match.length) out.push([province, match]);
    }
    return out;
  }, [groups, query]);

  const selected = useMemo(() => {
    if (value === 'pickup') return { name: 'Free pickup from HQ', isPickup: true };
    return ZIMBABWE_AREAS.find((a) => a.name === value) || null;
  }, [value]);

  // Close on outside click + esc
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Auto-focus search when the panel opens
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const select = useCallback(
    (area) => {
      const fee = calculateDeliveryFee(area.distance, pricing);
      onChange?.({
        name: area.name,
        distance: area.distance,
        province: area.province,
        deliveryFee: fee,
        isPickup: false,
      });
      setOpen(false);
      setQuery('');
    },
    [onChange, pricing],
  );

  const selectPickup = useCallback(() => {
    onChange?.({
      name: 'Free pickup from HQ',
      distance: 0,
      province: 'Harare',
      deliveryFee: 0,
      isPickup: true,
    });
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const summary = selected
    ? selected.isPickup
      ? 'Free pickup from HQ'
      : `${selected.name} · ${calculateDeliveryFee(selected.distance, pricing) === 0 ? 'Free' : `USD ${calculateDeliveryFee(selected.distance, pricing)}`}`
    : placeholder;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
          open
            ? 'border-taqon-orange/60 bg-white dark:bg-taqon-charcoal ring-2 ring-taqon-orange/15'
            : 'border-gray-200 dark:border-white/15 bg-white dark:bg-taqon-charcoal hover:border-taqon-orange/30'
        }`}
      >
        <MapPin size={16} weight="duotone" className="text-taqon-orange flex-shrink-0" />
        <span className={`flex-1 truncate text-sm ${selected ? 'text-taqon-charcoal dark:text-white font-medium' : 'text-taqon-muted dark:text-white/40'}`}>
          {summary}
        </span>
        {selected && !open && (
          <span
            role="button"
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.(null);
            }}
            className="text-taqon-muted hover:text-taqon-charcoal dark:hover:text-white p-1 -m-1"
          >
            <X size={14} />
          </span>
        )}
        <CaretDown
          size={14}
          weight="bold"
          className={`text-taqon-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-taqon-charcoal rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-white/10 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-white/10">
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search areas, e.g. Borrowdale, Bulawayo..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              />
            </div>
          </div>

          {/* Pickup option */}
          {allowPickup && !query && (
            <button
              type="button"
              onClick={selectPickup}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-white/10 ${
                value === 'pickup'
                  ? 'bg-taqon-orange/5'
                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <Storefront size={18} weight="duotone" className="text-taqon-orange flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">
                  Pickup from HQ
                </p>
                <p className="text-xs text-taqon-muted dark:text-white/45 mt-0.5">
                  203 Sherwood Drive, Strathaven, Harare
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-1 rounded-full flex-shrink-0">
                Free
              </span>
              {value === 'pickup' && (
                <Check size={16} weight="bold" className="text-taqon-orange flex-shrink-0" />
              )}
            </button>
          )}

          {/* Area list */}
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-taqon-muted dark:text-white/40">
                No areas matched <strong>"{query}"</strong>.
                <br />
                <span className="text-xs">
                  Choose the nearest known area or{' '}
                  <a href="https://wa.me/263772771036" target="_blank" rel="noreferrer" className="text-taqon-orange underline">
                    contact us
                  </a>
                  .
                </span>
              </div>
            ) : (
              filtered.map(([province, areas]) => (
                <div key={province} className="py-1">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-taqon-muted/80 dark:text-white/35">
                    {province}
                  </p>
                  {areas.map((area) => {
                    const fee = calculateDeliveryFee(area.distance, pricing);
                    const isSelected = value === area.name;
                    return (
                      <button
                        key={area.name}
                        type="button"
                        onClick={() => select(area)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-taqon-orange/5'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <Truck size={14} weight="duotone" className="text-taqon-muted flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium text-taqon-charcoal dark:text-white/85 truncate">
                          {area.name}
                        </span>
                        <span className="text-xs text-taqon-muted dark:text-white/45 tabular-nums flex-shrink-0">
                          {area.distance} km
                        </span>
                        {showPrice && (
                          <span className="text-xs font-bold text-taqon-charcoal dark:text-white tabular-nums flex-shrink-0 ml-2 min-w-[44px] text-right">
                            {fee === 0 ? 'Free' : `USD ${fee}`}
                          </span>
                        )}
                        {isSelected && (
                          <Check size={14} weight="bold" className="text-taqon-orange flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <p className="px-4 py-2.5 text-[10px] text-taqon-muted/80 dark:text-white/35 border-t border-gray-100 dark:border-white/10 leading-relaxed">
            Delivery: <strong>USD {pricing.baseFee}</strong> base + <strong>USD {pricing.perKm}/km</strong> from Taqon HQ in Strathaven, Harare.
          </p>
        </div>
      )}
    </div>
  );
}
