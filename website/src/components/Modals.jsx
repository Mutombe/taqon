import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Cookie } from '@phosphor-icons/react';

// Privacy Policy Modal
export function PrivacyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                  <Shield size={20} className="text-taqon-orange" />
                </div>
                <h2 className="text-xl font-bold font-syne">Privacy Policy</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[65vh] text-sm text-taqon-charcoal/80 leading-relaxed space-y-4">
              <p className="text-xs text-taqon-muted">Last updated: February 2026</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">1. Information We Collect</h3>
              <p>Taqon Electrico collects personal information that you voluntarily provide when contacting us, requesting quotes, or making purchases. This may include your name, email address, phone number, physical address, and payment information.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">2. How We Use Your Information</h3>
              <p>We use the collected information to provide our solar and electrical services, process orders, send updates about your installations, and improve our customer experience. We may also use your information to send relevant promotions about our products and services.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">3. Data Protection</h3>
              <p>We implement industry-standard security measures to protect your personal data. Your information is stored securely and access is limited to authorized personnel only.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">4. Third-Party Sharing</h3>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who assist in operating our business, provided they agree to keep your information confidential.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">5. Your Rights</h3>
              <p>You have the right to access, correct, or delete your personal information. To exercise these rights, please contact us at info@taqon.co.zw.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">6. Contact Us</h3>
              <p>For questions about this Privacy Policy, please contact Taqon Electrico at 203 Sherwood Drive, Strathaven, Harare, or email info@taqon.co.zw.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Cookie Policy Modal
export function CookieModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                  <Cookie size={20} className="text-taqon-orange" />
                </div>
                <h2 className="text-xl font-bold font-syne">Cookie Policy</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[65vh] text-sm text-taqon-charcoal/80 leading-relaxed space-y-4">
              <p className="text-xs text-taqon-muted">Last updated: February 2026</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">What Are Cookies?</h3>
              <p>Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">Essential Cookies</h3>
              <p>These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas. The website cannot function properly without these cookies.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">Analytics Cookies</h3>
              <p>We use analytics cookies to understand how visitors interact with our website. This helps us improve our website's functionality and user experience.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">Marketing Cookies</h3>
              <p>These cookies track your online activity to help us deliver more relevant advertising. They may be set by our advertising partners through our site.</p>

              <h3 className="font-semibold text-taqon-charcoal text-base mt-6">Managing Cookies</h3>
              <p>You can control and delete cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our website.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Cookie Consent Banner
export function CookieConsent({ onOpenCookies }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('taqon-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('taqon-cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('taqon-cookie-consent', 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[75] bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
              <Cookie size={16} className="text-taqon-orange" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-taqon-charcoal">We value your privacy</h4>
              <p className="text-xs text-taqon-muted mt-1 leading-relaxed">
                We use cookies to enhance your browsing experience and analyse our traffic.{' '}
                <button onClick={onOpenCookies} className="text-taqon-orange hover:underline">Learn more</button>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={decline}
              className="flex-1 py-2.5 px-4 text-xs font-medium rounded-xl border border-gray-200 text-taqon-charcoal hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="flex-1 py-2.5 px-4 text-xs font-medium rounded-xl bg-taqon-orange text-white hover:bg-taqon-orange/90 transition-colors"
            >
              Accept All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
