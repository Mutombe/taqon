import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import useAuthStore from '../../../stores/authStore';
import LoginView from './LoginView';
import RegisterView from './RegisterView';
import ForgotPasswordView from './ForgotPasswordView';

const views = {
  login: LoginView,
  register: RegisterView,
  'forgot-password': ForgotPasswordView,
};

export default function AuthModal() {
  const { isAuthModalOpen, authModalView, closeAuthModal } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    if (isAuthModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isAuthModalOpen, closeAuthModal]);

  const ViewComponent = views[authModalView] || LoginView;
  const isWide = authModalView === 'register';

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeAuthModal}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`auth-card backdrop-blur-xl rounded-2xl w-full ${
              isWide ? 'max-w-lg' : 'max-w-md'
            } max-h-[90vh] overflow-y-auto shadow-2xl relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-2 rounded-full auth-icon hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <ViewComponent />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
