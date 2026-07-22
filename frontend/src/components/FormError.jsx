import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FormError = ({ message, onClose }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="flex items-start justify-between gap-3 p-4 rounded-xl border"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
          }}
          role="alert"
        >
          <div className="flex gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-error-400" />
            <div className="text-sm text-error-300 leading-relaxed">
              {message}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-error-400/60 hover:text-error-400 hover:bg-error-500/10 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FormError;
