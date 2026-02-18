import React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Minus, RotateCcw, ArrowRight, Sun, Zap, AlertTriangle, Home } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';

const WATT_PER_PANEL = 550;

const roofTemplates = [
  {
    id: 'gable',
    name: 'Gable Roof',
    description: 'Standard A-frame house',
    gridCols: 6,
    gridRows: 4,
    maxPanels: 24,
  },
  {
    id: 'hip',
    name: 'Hip Roof',
    description: 'Four-sided sloped roof',
    gridCols: 5,
    gridRows: 4,
    maxPanels: 20,
  },
  {
    id: 'flat',
    name: 'Flat Roof',
    description: 'Commercial or modern style',
    gridCols: 7,
    gridRows: 5,
    maxPanels: 35,
  },
];

function RoofIllustration({ template, panelCount, orientation }) {
  const cols = orientation === 'landscape' ? template.gridCols : template.gridRows;
  const rows = orientation === 'landscape' ? template.gridRows : template.gridCols;
  const totalSlots = cols * rows;

  return (
    <div className="relative flex flex-col items-center">
      {/* House body */}
      <div className="relative w-full max-w-lg mx-auto">
        {/* Roof shape */}
        {template.id === 'gable' && (
          <div className="relative">
            <div
              className="w-0 h-0 mx-auto"
              style={{
                borderLeft: '260px solid transparent',
                borderRight: '260px solid transparent',
                borderBottom: '80px solid',
                borderBottomColor: 'var(--roof-color, #8B7355)',
              }}
            />
            <div className="h-2 bg-taqon-orange/30 rounded-b-sm" />
          </div>
        )}
        {template.id === 'hip' && (
          <div className="relative">
            <div className="flex justify-center">
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '220px solid transparent',
                  borderRight: '220px solid transparent',
                  borderBottom: '60px solid',
                  borderBottomColor: 'var(--roof-color, #8B7355)',
                }}
              />
            </div>
            <div className="h-4 bg-[#8B7355] mx-8 rounded-b" />
            <div className="h-2 bg-taqon-orange/30 rounded-b-sm" />
          </div>
        )}
        {template.id === 'flat' && (
          <div className="relative">
            <div className="h-6 bg-[#8B7355] rounded-t-lg" />
            <div className="h-2 bg-taqon-orange/30" />
          </div>
        )}

        {/* Panel grid overlay */}
        <div className="bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-b-lg p-4 relative overflow-hidden">
          {/* Roof surface where panels go */}
          <div
            className="grid gap-1.5 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              maxWidth: `${cols * 60}px`,
            }}
          >
            {Array.from({ length: totalSlots }).map((_, i) => {
              const isActive = i < panelCount;
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    backgroundColor: isActive ? '#1a3a5c' : 'rgba(200,200,200,0.3)',
                    borderColor: isActive ? '#F26522' : 'rgba(180,180,180,0.4)',
                    scale: isActive ? 1 : 0.95,
                  }}
                  transition={{ duration: 0.2, delay: isActive ? i * 0.02 : 0 }}
                  className={`aspect-[3/4] rounded-sm border-2 relative ${
                    orientation === 'landscape' ? '!aspect-[4/3]' : ''
                  }`}
                  style={{
                    aspectRatio: orientation === 'landscape' ? '4/3' : '3/4',
                  }}
                >
                  {isActive && (
                    <>
                      {/* Panel grid lines */}
                      <div className="absolute inset-0.5 grid grid-cols-2 grid-rows-3 gap-px opacity-30">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <div key={j} className="bg-blue-300/50" />
                        ))}
                      </div>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-sm" />
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* House wall details */}
          <div className="mt-4 flex justify-center gap-6">
            <div className="w-12 h-16 bg-[#87CEEB]/40 dark:bg-blue-400/20 border-2 border-gray-400 dark:border-gray-500 rounded-sm" />
            <div className="w-16 h-20 bg-[#8B6914]/60 dark:bg-amber-900/40 border-2 border-gray-400 dark:border-gray-500 rounded-t-sm" />
            <div className="w-12 h-16 bg-[#87CEEB]/40 dark:bg-blue-400/20 border-2 border-gray-400 dark:border-gray-500 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SystemVisualizer() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [panelCount, setPanelCount] = useState(6);
  const [orientation, setOrientation] = useState('portrait');

  const currentTemplate = roofTemplates.find((t) => t.id === selectedTemplate);
  const maxPanels = currentTemplate ? currentTemplate.maxPanels : 0;
  const systemSizeW = panelCount * WATT_PER_PANEL;
  const systemSizeKW = (systemSizeW / 1000).toFixed(1);

  const adjustPanels = (delta) => {
    setPanelCount((prev) => Math.max(1, Math.min(maxPanels, prev + delta)));
  };

  const handleTemplateSelect = (id) => {
    setSelectedTemplate(id);
    const template = roofTemplates.find((t) => t.id === id);
    setPanelCount(Math.min(panelCount, template.maxPanels));
  };

  return (
    <>
      <SEO
        title="Solar System Visualizer"
        description="Visualize how solar panels would look on your roof. Use our interactive tool to estimate system size and get a personalized quote from Taqon Electrico."
        keywords="solar visualizer, roof solar panels, system size calculator, solar design tool, Zimbabwe solar"
        canonical="https://www.taqon.co.zw/visualizer"
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-15"
            loading="eager"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Design Tool
            </span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Solar System <span className="text-gradient">Visualizer</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              See how solar panels would fit on your roof and estimate your system size.
              Choose a roof type, adjust panels, and get an instant estimate.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Visualizer */}
      <section className="py-12 lg:py-20 bg-taqon-cream dark:bg-taqon-dark min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          {/* Step 1: Choose Roof */}
          <AnimatedSection className="mb-12">
            <div className="text-center mb-8">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                Step 1
              </span>
              <h2 className="mt-2 text-2xl lg:text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">
                Choose Your Roof Type
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {roofTemplates.map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${
                    selectedTemplate === template.id
                      ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10 shadow-lg shadow-taqon-orange/10'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-taqon-charcoal hover:border-taqon-orange/40'
                  }`}
                >
                  {/* Mini roof icon */}
                  <div className="mb-4 flex justify-center">
                    {template.id === 'gable' && (
                      <div className="w-20">
                        <div
                          className="w-0 h-0 mx-auto"
                          style={{
                            borderLeft: '40px solid transparent',
                            borderRight: '40px solid transparent',
                            borderBottom: `16px solid ${selectedTemplate === template.id ? '#F26522' : '#9CA3AF'}`,
                          }}
                        />
                        <div
                          className="h-8 rounded-b"
                          style={{ backgroundColor: selectedTemplate === template.id ? '#F26522' : '#D1D5DB', opacity: 0.5 }}
                        />
                      </div>
                    )}
                    {template.id === 'hip' && (
                      <div className="w-20">
                        <div
                          className="w-0 h-0 mx-auto"
                          style={{
                            borderLeft: '36px solid transparent',
                            borderRight: '36px solid transparent',
                            borderBottom: `12px solid ${selectedTemplate === template.id ? '#F26522' : '#9CA3AF'}`,
                          }}
                        />
                        <div
                          className="h-3 mx-2 rounded-b-sm"
                          style={{ backgroundColor: selectedTemplate === template.id ? '#F26522' : '#9CA3AF', opacity: 0.7 }}
                        />
                        <div
                          className="h-7 rounded-b"
                          style={{ backgroundColor: selectedTemplate === template.id ? '#F26522' : '#D1D5DB', opacity: 0.5 }}
                        />
                      </div>
                    )}
                    {template.id === 'flat' && (
                      <div className="w-20">
                        <div
                          className="h-3 rounded-t"
                          style={{ backgroundColor: selectedTemplate === template.id ? '#F26522' : '#9CA3AF' }}
                        />
                        <div
                          className="h-9 rounded-b"
                          style={{ backgroundColor: selectedTemplate === template.id ? '#F26522' : '#D1D5DB', opacity: 0.5 }}
                        />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white text-center">
                    {template.name}
                  </h3>
                  <p className="text-sm text-taqon-muted text-center mt-1">{template.description}</p>
                  <p className="text-xs text-taqon-orange text-center mt-2 font-medium">
                    Up to {template.maxPanels} panels
                  </p>
                </motion.button>
              ))}
            </div>
          </AnimatedSection>

          {/* Step 2: Configure */}
          <AnimatePresence mode="wait">
            {selectedTemplate && currentTemplate && (
              <motion.div
                key={selectedTemplate}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                  {/* Roof Visualization */}
                  <AnimatedSection variant="fadeLeft">
                    <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-white/10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white text-lg">
                          {currentTemplate.name} Preview
                        </h3>
                        <button
                          onClick={() => {
                            setSelectedTemplate(null);
                            setPanelCount(6);
                          }}
                          className="text-sm text-taqon-muted hover:text-taqon-orange transition-colors flex items-center gap-1"
                        >
                          <RotateCcw size={14} /> Reset
                        </button>
                      </div>
                      <RoofIllustration
                        template={currentTemplate}
                        panelCount={panelCount}
                        orientation={orientation}
                      />
                    </div>
                  </AnimatedSection>

                  {/* Controls */}
                  <AnimatedSection variant="fadeRight">
                    <div className="space-y-6">
                      {/* Panel Count */}
                      <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-6 border border-gray-100 dark:border-white/10">
                        <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white mb-4">
                          Number of Panels
                        </h3>
                        <div className="flex items-center justify-center gap-6">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => adjustPanels(-1)}
                            disabled={panelCount <= 1}
                            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-taqon-orange hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 dark:disabled:hover:bg-white/10 transition-colors"
                          >
                            <Minus size={20} />
                          </motion.button>
                          <div className="text-center">
                            <span className="text-5xl font-bold font-syne text-gradient">
                              {panelCount}
                            </span>
                            <p className="text-sm text-taqon-muted mt-1">panels</p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => adjustPanels(1)}
                            disabled={panelCount >= maxPanels}
                            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-taqon-orange hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 dark:disabled:hover:bg-white/10 transition-colors"
                          >
                            <Plus size={20} />
                          </motion.button>
                        </div>
                        {/* Quick adjust */}
                        <div className="flex gap-2 justify-center mt-4">
                          {[4, 6, 8, 10, 12, 16].filter((n) => n <= maxPanels).map((n) => (
                            <button
                              key={n}
                              onClick={() => setPanelCount(n)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                panelCount === n
                                  ? 'bg-taqon-orange text-white'
                                  : 'bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/10'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Orientation Toggle */}
                      <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-6 border border-gray-100 dark:border-white/10">
                        <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white mb-4">
                          Panel Orientation
                        </h3>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setOrientation('portrait')}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                              orientation === 'portrait'
                                ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                                : 'bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white/70'
                            }`}
                          >
                            <div className="w-4 h-6 border-2 border-current rounded-sm" />
                            Portrait
                          </button>
                          <button
                            onClick={() => setOrientation('landscape')}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                              orientation === 'landscape'
                                ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                                : 'bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white/70'
                            }`}
                          >
                            <div className="w-6 h-4 border-2 border-current rounded-sm" />
                            Landscape
                          </button>
                        </div>
                      </div>

                      {/* System Estimate */}
                      <div className="bg-gradient-to-br from-taqon-orange to-taqon-amber rounded-3xl p-6 text-white">
                        <h3 className="font-bold font-syne text-lg mb-4">
                          System Size Estimate
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/15 rounded-xl p-4 text-center backdrop-blur-sm">
                            <Sun size={24} className="mx-auto mb-2 opacity-80" />
                            <div className="text-2xl font-bold font-syne">{panelCount}</div>
                            <div className="text-xs text-white/70">Panels</div>
                          </div>
                          <div className="bg-white/15 rounded-xl p-4 text-center backdrop-blur-sm">
                            <Zap size={24} className="mx-auto mb-2 opacity-80" />
                            <div className="text-2xl font-bold font-syne">{systemSizeKW} kW</div>
                            <div className="text-xs text-white/70">System Size</div>
                          </div>
                        </div>
                        <div className="mt-4 bg-white/10 rounded-xl p-3 text-center">
                          <p className="text-sm">
                            <span className="font-bold">{systemSizeW.toLocaleString()}W</span> total at{' '}
                            <span className="font-bold">{WATT_PER_PANEL}W</span> per panel
                          </p>
                        </div>
                        <Link
                          to="/quote"
                          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-white text-taqon-orange py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                        >
                          Get a Quote <ArrowRight size={16} />
                        </Link>
                      </div>

                      {/* Disclaimer */}
                      <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
                          This visualization is approximate. A proper site survey is required for
                          accurate system design. Panel count, orientation, and shading analysis
                          will be confirmed during a professional assessment by our engineers.
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Not selected state */}
          {!selectedTemplate && (
            <AnimatedSection className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-taqon-orange/10 dark:bg-taqon-orange/20 flex items-center justify-center mx-auto mb-4">
                <Home size={32} className="text-taqon-orange" />
              </div>
              <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                Select a Roof Type Above
              </h3>
              <p className="mt-2 text-taqon-muted max-w-md mx-auto">
                Choose the roof style that most closely matches your property to begin designing
                your solar panel layout.
              </p>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Ready for a Professional Assessment?
            </h2>
            <p className="mt-3 text-taqon-muted max-w-lg mx-auto">
              Our engineers will visit your property, assess your roof, and design the optimal
              solar system for your needs.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/quote"
                className="inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Request Free Site Survey <ArrowRight size={16} />
              </Link>
              <Link
                to="/calculator"
                className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
              >
                Try Savings Calculator
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
