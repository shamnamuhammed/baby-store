import React from 'react';
import { motion } from 'framer-motion';

const LoadingButton = ({
  children,
  loading,
  loadingText = 'Loading...',
  type = 'submit',
  className = '',
  disabled,
  variant = 'primary',
  icon: Icon,
  ...props
}) => {
  const base = `
    w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white
    flex items-center justify-center gap-2
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-violet-500/40
    ${className}
  `;

  const styles = {
    primary: 'btn-primary',
    accent: 'btn-accent',
    ghost: 'btn-ghost text-white',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`${base} ${styles[variant] || styles.primary}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-white/80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default LoadingButton;
