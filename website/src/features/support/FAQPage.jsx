import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass, CaretDown, CaretUp, Question,
  ThumbsUp, ThumbsDown, ChatsTeardrop,
} from '@phosphor-icons/react';
import { supportApi } from '../../api/support';
import SEO from '../../components/SEO';
import { SkeletonBox } from '../../components/Skeletons';

const CATEGORY_LABELS = {
  general: 'General',
  sales: 'Sales',
  technical_support: 'Technical Support',
  billing: 'Billing',
  installation: 'Installation',
  maintenance: 'Maintenance',
  complaint: 'Complaint',
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  useEffect(() => {
    supportApi.getFAQCategories().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (search) params.search = search;

    supportApi.getFAQs(params)
      .then(({ data }) => setFaqs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const handleFeedback = async (faqId, helpful) => {
    try {
      await supportApi.faqFeedback(faqId, helpful);
      setFeedbackGiven((prev) => ({ ...prev, [faqId]: helpful }));
    } catch {
      // Silently fail
    }
  };

  return (
    <>
      <SEO
        title="FAQ — Frequently Asked Questions"
        description="Find answers to common questions about solar installations, pricing, warranties, and more."
      />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-taqon-orange/10 text-taqon-orange px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Question size={16} />
              Help Center
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Find quick answers to common questions about our solar solutions.
            </p>
          </motion.div>

          {/* Search */}
          <div className="relative mb-6">
            <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full bg-white dark:bg-taqon-charcoal/50 text-taqon-charcoal dark:text-white rounded-xl pl-11 pr-4 py-3 border border-warm-200 dark:border-white/10 focus:border-taqon-orange focus:ring-0"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                !activeCategory ? 'bg-taqon-orange text-taqon-charcoal dark:text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  activeCategory === cat.category
                    ? 'bg-taqon-orange text-taqon-charcoal dark:text-white'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {CATEGORY_LABELS[cat.category] || cat.category} ({cat.count})
              </button>
            ))}
          </div>

          {/* FAQ List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-taqon-charcoal/40 border border-warm-100 dark:border-white/5 rounded-xl p-5">
                  <SkeletonBox className="h-5 w-3/4 rounded-md mb-2" />
                  <SkeletonBox className="h-3 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
              <Question size={40} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No FAQs Found</h3>
              <p className="text-sm text-gray-500">Try a different search term or category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white dark:bg-taqon-charcoal/50 rounded-xl border border-warm-100 dark:border-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 pr-4">
                      {faq.is_featured && (
                        <span className="w-2 h-2 rounded-full bg-taqon-orange mt-2 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-taqon-charcoal dark:text-white text-sm">{faq.question}</span>
                    </div>
                    {expandedId === faq.id
                      ? <CaretUp size={16} className="text-gray-500 flex-shrink-0" />
                      : <CaretDown size={16} className="text-gray-500 flex-shrink-0" />
                    }
                  </button>

                  <AnimatePresence>
                    {expandedId === faq.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-warm-100 dark:border-white/5">
                          <p className="text-sm text-gray-400 whitespace-pre-line pt-4 mb-4">
                            {faq.answer}
                          </p>

                          {/* Feedback */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-600">Was this helpful?</span>
                            {feedbackGiven[faq.id] !== undefined ? (
                              <span className="text-xs text-taqon-orange">Thanks for your feedback!</span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleFeedback(faq.id, true)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-400 transition-colors"
                                >
                                  <ThumbsUp size={12} /> Yes ({faq.helpful_count})
                                </button>
                                <button
                                  onClick={() => handleFeedback(faq.id, false)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                                >
                                  <ThumbsDown size={12} /> No ({faq.not_helpful_count})
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 text-center bg-white dark:bg-taqon-charcoal/40 rounded-2xl p-8 border border-warm-100 dark:border-white/5">
            <ChatsTeardrop size={32} className="text-taqon-orange mx-auto mb-3" />
            <h3 className="text-lg font-bold text-taqon-charcoal dark:text-white mb-2">Still have questions?</h3>
            <p className="text-sm text-gray-400 mb-4">Our support team is here to help.</p>
            <Link
              to="/support/create"
              className="inline-block px-6 py-2.5 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-xl transition-colors"
            >
              Create Support Ticket
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
