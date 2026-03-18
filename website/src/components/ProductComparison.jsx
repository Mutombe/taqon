import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus } from '@phosphor-icons/react';

export default function ProductComparison({ products = [], isOpen, onClose }) {
  if (!products || products.length < 2) return null;

  const allSpecLabels = [];
  products.forEach((p) => {
    p.specs.forEach((spec) => {
      const label = spec.replace(/^[\d.]+\s*/, '').trim();
      if (!allSpecLabels.includes(label)) allSpecLabels.push(label);
    });
  });

  const getSpecValue = (product, label) => {
    const match = product.specs.find((s) => s.includes(label) || label.includes(s.replace(/^[\d.]+\s*/, '').trim()));
    return match || null;
  };

  const isDifferent = (row) => {
    const values = products.map((p) => row(p));
    return values.some((v, i) => i > 0 && v !== values[0]);
  };

  const rows = [
    { label: 'Price', getValue: (p) => `$${p.price}`, highlight: isDifferent((p) => p.price) },
    { label: 'Brand', getValue: (p) => p.brand, highlight: isDifferent((p) => p.brand) },
    { label: 'Warranty', getValue: (p) => p.warranty, highlight: isDifferent((p) => p.warranty) },
    {
      label: 'Category',
      getValue: (p) =>
        p.category === 'panels' ? 'Solar Panel' : p.category === 'batteries' ? 'Battery' : 'Inverter',
      highlight: isDifferent((p) => p.category),
    },
    ...allSpecLabels.map((specLabel) => ({
      label: specLabel,
      getValue: (p) => getSpecValue(p, specLabel),
      highlight: true,
    })),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Tray */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[95] max-h-[85vh] bg-white dark:bg-taqon-charcoal rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-taqon-charcoal border-b border-gray-100 dark:border-white/10 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">
                  Product Comparison
                </h3>
                <p className="text-sm text-taqon-muted">
                  Comparing {products.length} products
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                <X size={18} className="text-taqon-charcoal dark:text-white" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1 p-6">
              <table className="w-full min-w-[600px]">
                {/* Product Images & Names */}
                <thead className="sticky top-0 z-10 bg-white dark:bg-taqon-charcoal">
                  <tr>
                    <th className="text-left p-3 w-40">
                      <span className="text-xs uppercase tracking-wider text-taqon-muted font-semibold">Feature</span>
                    </th>
                    {products.map((product) => (
                      <th key={product.id} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <img
                              src={product.primary_image?.image_url || product.primary_image?.image || ''}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-bold text-taqon-charcoal dark:text-white font-syne line-clamp-2 max-w-[180px]">
                            {product.name}
                          </span>
                          {product.is_on_sale && (
                            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                              SALE
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-t border-gray-50 dark:border-white/5 ${
                        i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="p-3">
                        <span
                          className={`text-sm font-medium ${
                            row.highlight
                              ? 'text-taqon-orange font-semibold'
                              : 'text-taqon-charcoal dark:text-white/80'
                          }`}
                        >
                          {row.label}
                        </span>
                      </td>
                      {products.map((product) => {
                        const value = row.getValue(product);
                        return (
                          <td key={product.id} className="p-3 text-center">
                            {value ? (
                              <span
                                className={`text-sm ${
                                  row.highlight
                                    ? 'font-semibold text-taqon-charcoal dark:text-white'
                                    : 'text-taqon-muted dark:text-white/60'
                                }`}
                              >
                                {value}
                              </span>
                            ) : (
                              <Minus size={16} className="text-gray-300 dark:text-white/20 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-taqon-charcoal border-t border-gray-100 dark:border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-taqon-muted">
                  <span className="inline-block w-2 h-2 bg-taqon-orange rounded-full mr-1.5" />
                  Orange highlighted rows indicate differences between products
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-taqon-orange text-white rounded-full text-sm font-semibold hover:bg-taqon-orange/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
