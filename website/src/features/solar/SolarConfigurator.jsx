import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, BatteryFull, Lightning, PlugsConnected, Wrench, Package,
  Plus, Minus, Trash, FloppyDisk, Copy, FileText,
  Warning, Check, CaretDown, CaretRight,
  MagnifyingGlass, Funnel, X, CircleNotch, ArrowRight, Gear,
  BatteryCharging, Gauge, Clock, Leaf,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { solarConfigApi } from '../../api/solarConfig';
import SEO from '../../components/SEO';
import AnimatedSection from '../../components/AnimatedSection';

const CATEGORY_ICONS = {
  panel: Sun,
  inverter: Lightning,
  battery: BatteryFull,
  charger: BatteryCharging,
  mounting: Package,
  cable: PlugsConnected,
  accessory: Wrench,
};

const CATEGORY_COLORS = {
  panel: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  inverter: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  battery: 'bg-green-500/10 text-green-600 dark:text-green-400',
  charger: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  mounting: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  cable: 'bg-red-500/10 text-red-600 dark:text-red-400',
  accessory: 'bg-taqon-orange/10 text-taqon-orange',
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

// ── Stats Card ──
function StatCard({ icon: Icon, label, value, unit, color = 'text-taqon-orange' }) {
  return (
    <div className="bg-white dark:bg-taqon-charcoal/50 rounded-2xl p-4 border border-gray-200/50 dark:border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={color} />
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-syne text-gray-900 dark:text-white">{value}</span>
        {unit && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

// ── Component Card (for selection) ──
function ComponentCard({ component, onAdd, isInConfig }) {
  const Icon = CATEGORY_ICONS[component.category] || Package;
  const colorClass = CATEGORY_COLORS[component.category] || 'bg-gray-500/10 text-gray-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative bg-white dark:bg-taqon-charcoal/50 rounded-2xl p-4 border transition-all hover:shadow-lg ${
        isInConfig
          ? 'border-taqon-orange/30 ring-1 ring-taqon-orange/20'
          : 'border-gray-200/50 dark:border-white/5 hover:border-taqon-orange/30'
      }`}
    >
      {isInConfig && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-taqon-orange rounded-full flex items-center justify-center">
          <Check size={14} className="text-white" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{component.name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{component.brand}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        {component.wattage > 0 && <span>{component.wattage}W</span>}
        {component.voltage > 0 && <span>{component.voltage}V</span>}
        {component.capacity_kwh > 0 && <span>{component.capacity_kwh}kWh</span>}
        {component.efficiency > 0 && <span>{component.efficiency}%</span>}
        {component.warranty_years > 0 && <span>{component.warranty_years}yr</span>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-gray-900 dark:text-white">{formatPrice(component.price)}</span>
        <button
          onClick={() => onAdd(component)}
          className="px-3 py-1.5 bg-taqon-orange/10 hover:bg-taqon-orange text-taqon-orange hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </motion.div>
  );
}

// ── Config Item Row ──
function ConfigItemRow({ item, onUpdateQuantity, onRemove }) {
  const Icon = CATEGORY_ICONS[item.component.category] || Package;
  const colorClass = CATEGORY_COLORS[item.component.category] || 'bg-gray-500/10 text-gray-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 bg-white dark:bg-taqon-charcoal/50 rounded-xl p-3 border border-gray-200/50 dark:border-white/5"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.component.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(item.component.price)} each</p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onUpdateQuantity(item, Math.max(1, item.quantity - 1))}
          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          <Minus size={14} className="text-gray-600 dark:text-gray-300" />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item, item.quantity + 1)}
          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          <Plus size={14} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[80px] text-right">
        {formatPrice(item.line_total)}
      </span>

      <button
        onClick={() => onRemove(item)}
        className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors"
      >
        <Trash size={14} className="text-gray-400 hover:text-red-500" />
      </button>
    </motion.div>
  );
}

// ── Warnings Panel ──
function WarningsPanel({ warnings }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Warning size={16} className="text-amber-600 dark:text-amber-400" />
        <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300">System Warnings</h4>
      </div>
      <ul className="space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="text-xs text-amber-700 dark:text-amber-300/80 flex items-start gap-2">
            <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ══════════════════════════════════════════════
// Main Configurator Page
// ══════════════════════════════════════════════

export default function SolarConfigurator() {
  const [searchParams] = useSearchParams();

  // State
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Configuration state (local until saved)
  const [configName, setConfigName] = useState('My Solar System');
  const [systemVoltage, setSystemVoltage] = useState(48);
  const [configItems, setConfigItems] = useState([]); // [{component, quantity}]
  const [savedConfigId, setSavedConfigId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  // Panel visibility
  const [showComponentPanel, setShowComponentPanel] = useState(true);

  // Load components on mount
  useEffect(() => {
    loadComponents();
  }, []);

  // Load from template if ?template=slug param present
  useEffect(() => {
    const templateSlug = searchParams.get('template');
    if (templateSlug) {
      loadFromTemplate(templateSlug);
    }
  }, [searchParams]);

  const loadComponents = async () => {
    setLoadingComponents(true);
    try {
      const [compRes, catRes] = await Promise.all([
        solarConfigApi.getComponents({ page_size: 100 }),
        solarConfigApi.getComponentCategories(),
      ]);
      setComponents(compRes.data.results || compRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load components:', err);
      toast.error('Failed to load components. Using offline mode.');
    } finally {
      setLoadingComponents(false);
    }
  };

  const loadFromTemplate = async (slug) => {
    try {
      const { data } = await solarConfigApi.getPackageDetail(slug);
      setConfigName(data.name);
      if (data.items) {
        setConfigItems(
          data.items.map((item) => ({
            component: item.component,
            quantity: item.quantity,
            id: item.id,
          }))
        );
      }
      toast.success(`Loaded template: ${data.name}`);
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  };

  // Filtered components
  const filteredComponents = useMemo(() => {
    let filtered = components;

    if (activeCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === activeCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.brand.toLowerCase().includes(term) ||
          (c.model_number && c.model_number.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [components, activeCategory, searchTerm]);

  // IDs of components in the config
  const configComponentIds = useMemo(
    () => new Set(configItems.map((item) => item.component.id)),
    [configItems]
  );

  // Calculated system stats
  const systemStats = useMemo(() => {
    let totalPrice = 0;
    let totalPanelWatts = 0;
    let totalBatteryKwh = 0;
    let inverterVa = 0;
    let warnings = [];

    configItems.forEach(({ component, quantity }) => {
      totalPrice += parseFloat(component.price) * quantity;

      if (component.category === 'panel') {
        totalPanelWatts += component.wattage * quantity;
      } else if (component.category === 'battery') {
        totalBatteryKwh += parseFloat(component.capacity_kwh || 0) * quantity;
      } else if (component.category === 'inverter') {
        inverterVa = Math.max(inverterVa, component.wattage);
      }
    });

    if (inverterVa > 0 && totalPanelWatts > inverterVa * 1.5) {
      warnings.push('Panel wattage exceeds 150% of inverter capacity. Consider a larger inverter.');
    }
    if (totalPanelWatts > 0 && inverterVa === 0) {
      warnings.push('No inverter selected. An inverter is required to convert DC to AC power.');
    }
    if (totalBatteryKwh === 0 && totalPanelWatts > 0) {
      warnings.push('No battery selected. Batteries are recommended for backup power.');
    }

    const dailyKwh = Math.round(totalPanelWatts * 5.5 * 0.8 / 1000 * 100) / 100;
    const avgLoadKw = inverterVa > 0 ? (inverterVa * 0.5) / 1000 : 0;
    const backupHours = avgLoadKw > 0 ? Math.round((totalBatteryKwh / avgLoadKw) * 10) / 10 : 0;

    return {
      totalPrice,
      totalPanelWatts,
      totalBatteryKwh,
      inverterVa,
      dailyKwh,
      backupHours,
      warnings,
      itemCount: configItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [configItems]);

  // Handlers
  const handleAddComponent = useCallback((component) => {
    setConfigItems((prev) => {
      const existing = prev.find((item) => item.component.id === component.id);
      if (existing) {
        return prev.map((item) =>
          item.component.id === component.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { component, quantity: 1 }];
    });
    toast.success(`Added ${component.name}`);
  }, []);

  const handleUpdateQuantity = useCallback((item, newQuantity) => {
    if (newQuantity < 1) return;
    setConfigItems((prev) =>
      prev.map((i) =>
        i.component.id === item.component.id ? { ...i, quantity: newQuantity } : i
      )
    );
  }, []);

  const handleRemoveItem = useCallback((item) => {
    setConfigItems((prev) => prev.filter((i) => i.component.id !== item.component.id));
    toast.success(`Removed ${item.component.name}`);
  }, []);

  const handleSave = async () => {
    if (configItems.length === 0) {
      toast.error('Add at least one component before saving.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: configName,
        system_voltage: systemVoltage,
        items: configItems.map((item) => ({
          component_id: item.component.id,
          quantity: item.quantity,
        })),
      };

      if (savedConfigId) {
        // Update existing
        await solarConfigApi.replaceItems(savedConfigId, payload.items);
        await solarConfigApi.updateConfiguration(savedConfigId, {
          name: configName,
          system_voltage: systemVoltage,
        });
        toast.success('Configuration updated!');
      } else {
        // Create new
        const { data } = await solarConfigApi.createConfiguration(payload);
        setSavedConfigId(data.id);
        toast.success('Configuration saved!');
      }
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(err.response?.data?.detail || 'Failed to save. Please log in first.');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToQuote = async () => {
    if (!savedConfigId) {
      // Save first
      await handleSave();
      if (!savedConfigId) return;
    }
    setConverting(true);
    try {
      await solarConfigApi.convertToQuote(savedConfigId);
      toast.success('Quotation request created! Our team will be in touch.');
    } catch (err) {
      console.error('Convert failed:', err);
      toast.error(err.response?.data?.detail || 'Failed to create quotation request.');
    } finally {
      setConverting(false);
    }
  };

  const handleClearConfig = () => {
    setConfigItems([]);
    setSavedConfigId(null);
    setConfigName('My Solar System');
    toast.success('Configuration cleared.');
  };

  return (
    <>
      <SEO
        title="Solar System Configurator"
        description="Build your custom solar system with Taqon Electrico's interactive configurator. Select panels, inverters, batteries, and accessories with real-time pricing and compatibility checks."
        keywords="solar configurator Zimbabwe, build solar system, custom solar package, solar system builder"
        canonical="https://www.taqon.co.zw/configurator"
      />

      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-10"
            loading="eager"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              System Builder
            </span>
            <h1 className="mt-3 text-4xl lg:text-5xl font-bold font-syne text-white">
              Build Your <span className="text-gradient">Solar System</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Select components, see real-time pricing and compatibility checks, then save or request a quote.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Config Header Bar */}
      <section className="sticky top-16 z-30 bg-white/80 dark:bg-taqon-dark/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              className="bg-transparent border-b border-dashed border-gray-300 dark:border-white/20 text-lg font-semibold font-syne text-gray-900 dark:text-white focus:outline-none focus:border-taqon-orange px-1 py-0.5 min-w-0"
            />
            <select
              value={systemVoltage}
              onChange={(e) => setSystemVoltage(Number(e.target.value))}
              className="bg-gray-100 dark:bg-white/5 text-sm rounded-lg px-3 py-1.5 border-0 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-taqon-orange"
            >
              <option value={12}>12V System</option>
              <option value={24}>24V System</option>
              <option value={48}>48V System</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-syne text-taqon-orange">
              {formatPrice(systemStats.totalPrice)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {systemStats.itemCount} items
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 bg-taqon-cream dark:bg-taqon-dark min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Component Selector Panel */}
            <div className={`${showComponentPanel ? 'lg:col-span-5' : 'lg:col-span-1'} transition-all`}>
              <div className="sticky top-36">
                {/* Toggle on mobile */}
                <button
                  onClick={() => setShowComponentPanel(!showComponentPanel)}
                  className="lg:hidden mb-4 flex items-center gap-2 text-sm font-semibold text-taqon-orange"
                >
                  {showComponentPanel ? <X size={16} /> : <Funnel size={16} />}
                  {showComponentPanel ? 'Hide Components' : 'Browse Components'}
                </button>

                <AnimatePresence>
                  {showComponentPanel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Search */}
                      <div className="relative mb-4">
                        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search components..."
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-taqon-charcoal/50 border border-gray-200/50 dark:border-white/5 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-taqon-orange"
                        />
                      </div>

                      {/* Category tabs */}
                      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                          onClick={() => setActiveCategory('all')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                            activeCategory === 'all'
                              ? 'bg-taqon-orange text-white'
                              : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                        >
                          All ({components.length})
                        </button>
                        {categories.map((cat) => {
                          const Icon = CATEGORY_ICONS[cat.value] || Package;
                          return (
                            <button
                              key={cat.value}
                              onClick={() => setActiveCategory(cat.value)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                                activeCategory === cat.value
                                  ? 'bg-taqon-orange text-white'
                                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                              }`}
                            >
                              <Icon size={12} />
                              {cat.label} ({cat.count})
                            </button>
                          );
                        })}
                      </div>

                      {/* Component Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                        {loadingComponents ? (
                          [...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-white dark:bg-taqon-charcoal/50 rounded-2xl p-4 h-40 border border-gray-200/50 dark:border-white/5" />
                          ))
                        ) : filteredComponents.length === 0 ? (
                          <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                            No components found.
                          </div>
                        ) : (
                          <AnimatePresence mode="popLayout">
                            {filteredComponents.map((comp) => (
                              <ComponentCard
                                key={comp.id}
                                component={comp}
                                onAdd={handleAddComponent}
                                isInConfig={configComponentIds.has(comp.id)}
                              />
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Configuration Panel */}
            <div className={`${showComponentPanel ? 'lg:col-span-7' : 'lg:col-span-11'}`}>
              {/* System Stats */}
              <AnimatedSection>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <StatCard icon={Sun} label="Panel Power" value={systemStats.totalPanelWatts} unit="W" color="text-yellow-500" />
                  <StatCard icon={Lightning} label="Inverter" value={systemStats.inverterVa} unit="VA" color="text-blue-500" />
                  <StatCard icon={BatteryFull} label="Battery" value={systemStats.totalBatteryKwh} unit="kWh" color="text-green-500" />
                  <StatCard icon={Gauge} label="Daily Output" value={systemStats.dailyKwh} unit="kWh" color="text-taqon-orange" />
                  <StatCard icon={Clock} label="Backup" value={systemStats.backupHours} unit="hrs" color="text-purple-500" />
                  <StatCard icon={Leaf} label="CO₂ Saved" value={Math.round(systemStats.dailyKwh * 365 * 0.7)} unit="kg/yr" color="text-emerald-500" />
                </div>
              </AnimatedSection>

              {/* Warnings */}
              <WarningsPanel warnings={systemStats.warnings} />

              {/* Config Items */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold font-syne text-gray-900 dark:text-white">
                    Your Components
                  </h3>
                  {configItems.length > 0 && (
                    <button
                      onClick={handleClearConfig}
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <Trash size={12} /> Clear All
                    </button>
                  )}
                </div>

                {configItems.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                    <Gear size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Start Building
                    </h4>
                    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
                      Browse components on the left and add them to your configuration. Or start from a{' '}
                      <Link to="/packages" className="text-taqon-orange hover:underline">
                        pre-built package
                      </Link>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {configItems.map((item) => (
                        <ConfigItemRow
                          key={item.component.id}
                          item={item}
                          onUpdateQuantity={handleUpdateQuantity}
                          onRemove={handleRemoveItem}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Total & Actions */}
              {configItems.length > 0 && (
                <AnimatedSection>
                  <div className="mt-6 bg-white dark:bg-taqon-charcoal/50 rounded-2xl p-6 border border-gray-200/50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total System Cost</p>
                        <p className="text-3xl font-bold font-syne text-gray-900 dark:text-white">
                          {formatPrice(systemStats.totalPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">System Size</p>
                        <p className="text-xl font-bold text-taqon-orange">
                          {(systemStats.totalPanelWatts / 1000).toFixed(1)} kW
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 px-6 bg-taqon-orange hover:bg-taqon-orange/90 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <CircleNotch size={18} className="animate-spin" />
                        ) : (
                          <FloppyDisk size={18} />
                        )}
                        {savedConfigId ? 'Update Configuration' : 'Save Configuration'}
                      </button>

                      <button
                        onClick={handleConvertToQuote}
                        disabled={converting}
                        className="flex-1 py-3 px-6 bg-taqon-dark dark:bg-white hover:bg-taqon-charcoal dark:hover:bg-gray-100 text-white dark:text-taqon-dark font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {converting ? (
                          <CircleNotch size={18} className="animate-spin" />
                        ) : (
                          <FileText size={18} />
                        )}
                        Request Quote
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
                      Prices are indicative. Final quotation may vary based on installation requirements.
                    </p>
                  </div>
                </AnimatedSection>
              )}

              {/* Quick Start Templates */}
              {configItems.length === 0 && (
                <QuickStartTemplates />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Quick Start Templates Section ──
function QuickStartTemplates() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    solarConfigApi.getPackages()
      .then(({ data }) => setPackages(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-taqon-charcoal/50 rounded-2xl h-48 border border-gray-200/50 dark:border-white/5" />
        ))}
      </div>
    );
  }

  if (packages.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold font-syne text-gray-900 dark:text-white mb-4">
        Quick Start — Pre-Built Packages
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            to={`/configurator?template=${pkg.slug}`}
            className="group bg-white dark:bg-taqon-charcoal/50 rounded-2xl p-5 border border-gray-200/50 dark:border-white/5 hover:border-taqon-orange/30 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                pkg.is_popular
                  ? 'bg-taqon-orange/10 text-taqon-orange'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
              }`}>
                {pkg.tier}
              </span>
              <CaretRight size={16} className="text-gray-400 group-hover:text-taqon-orange transition-colors" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{pkg.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
              {pkg.short_description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-taqon-orange">{formatPrice(pkg.price)}</span>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {pkg.system_size_kw > 0 && <span>{pkg.system_size_kw}kW</span>}
                {pkg.backup_hours > 0 && <span>{pkg.backup_hours}hrs</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
