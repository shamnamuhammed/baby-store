import React from 'react';

const InputField = React.forwardRef(({
  label,
  id,
  type = 'text',
  placeholder,
  icon: Icon,
  error,
  isValid,
  required,
  className = '',
  helpText,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-zinc-300 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-pink-400">*</span>}
        </label>
      )}

      <div className="relative rounded-xl transition-all duration-200">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}

        <input
          id={id}
          type={type}
          ref={ref}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            w-full py-3 pr-4 ${Icon ? 'pl-10' : 'pl-4'}
            bg-zinc-900 border rounded-xl text-sm
            text-white placeholder-zinc-600
            transition-all duration-200
            focus:outline-none focus:ring-2
            ${error
              ? 'border-error-500/60 focus:ring-error-500/30 focus:border-error-500'
              : isValid
              ? 'border-success-500/50 focus:ring-success-500/20 focus:border-success-500/60'
              : 'border-white/[0.08] focus:ring-violet-500/30 focus:border-violet-500/50 hover:border-white/20'
            }
          `}
          {...props}
        />

        {/* Valid tick */}
        {isValid && !error && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-success-500/20 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {error && (
        <span
          id={`${id}-error`}
          className="text-xs font-medium text-error-400 flex items-center gap-1 animate-fade-up"
          role="alert"
        >
          {error.message || error}
        </span>
      )}

      {helpText && !error && (
        <p className="text-xs text-zinc-600">{helpText}</p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';
export default InputField;
