import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import InputField from './InputField';

const PasswordField = React.forwardRef(({
  label,
  id,
  placeholder,
  error,
  isValid,
  required,
  value = '',
  onChange,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  // Derive password validation directly from the current value.
  const password = value || '';

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  // Calculate password strength without additional state or effects.
  const score = Object.values(checks).filter(Boolean).length;

  let strength = {
    label: 'Weak',
    score,
    color: 'bg-brand-pink-400',
  };

  if (!password) {
    strength = {
      label: 'Empty',
      score: 0,
      color: 'bg-brand-gray-200',
    };
  } else if (score >= 5) {
    strength = {
      label: 'Strong',
      score,
      color: 'bg-brand-sage-500',
    };
  } else if (score >= 3) {
    strength = {
      label: 'Medium',
      score,
      color: 'bg-brand-yellow-400',
    };
  }

  const toggleVisibility = (e) => {
    e.preventDefault();
    setShowPassword((previous) => !previous);
  };

  const handleInputChange = (e) => {
    setTouched(true);
    onChange?.(e);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative">
        <InputField
          id={id}
          label={label}
          type={showPassword ? 'text' : 'password'}
          ref={ref}
          placeholder={placeholder}
          error={error}
          isValid={isValid}
          required={required}
          icon={Lock}
          value={value}
          onChange={handleInputChange}
          {...props}
        />

        {/* Toggle password visibility */}
        <button
          type="button"
          onClick={toggleVisibility}
          tabIndex={-1}
          className="absolute top-[38px] right-3.5 p-1 rounded-md text-brand-gray-400 hover:text-brand-gray-600 dark:hover:text-brand-gray-200 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Password strength indicator and requirements */}
      {touched && password && (
        <div className="mt-1 flex flex-col gap-2.5 p-3.5 bg-brand-gray-50 dark:bg-brand-gray-900/30 rounded-xl border border-brand-gray-100 dark:border-brand-gray-800/80 animate-fade-in">
          {/* Strength label */}
          <div className="flex items-center justify-between text-xs font-semibold text-brand-gray-500 dark:text-brand-gray-400">
            <span>Password Strength:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-white text-[10px] uppercase font-bold tracking-wider ${strength.color}`}
            >
              {strength.label}
            </span>
          </div>

          {/* Strength progress bar */}
          <div className="h-1.5 w-full bg-brand-gray-200 dark:bg-brand-gray-800 rounded-full overflow-hidden flex gap-1">
            <div
              className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${(strength.score / 5) * 100}%` }}
            />
          </div>

          {/* Password requirements checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 mt-1 border-t border-brand-gray-200/50 dark:border-brand-gray-800/50 pt-2.5">
            <ChecklistRule
              label="Minimum 8 characters"
              met={checks.length}
            />
            <ChecklistRule
              label="Uppercase letter (A-Z)"
              met={checks.uppercase}
            />
            <ChecklistRule
              label="Lowercase letter (a-z)"
              met={checks.lowercase}
            />
            <ChecklistRule
              label="Number (0-9)"
              met={checks.number}
            />
            <ChecklistRule
              label="Special character (!@#...)"
              met={checks.special}
            />
          </div>
        </div>
      )}
    </div>
  );
});

const ChecklistRule = ({ label, met }) => (
  <div className="flex items-center gap-1.5 text-xs text-brand-gray-500 dark:text-brand-gray-400 transition-colors duration-200">
    {met ? (
      <Check className="w-3.5 h-3.5 text-brand-sage-500 flex-shrink-0" />
    ) : (
      <X className="w-3.5 h-3.5 text-brand-pink-400 flex-shrink-0" />
    )}

    <span
      className={
        met
          ? 'text-brand-sage-600 dark:text-brand-sage-400 line-through opacity-85'
          : ''
      }
    >
      {label}
    </span>
  </div>
);

PasswordField.displayName = 'PasswordField';

export default PasswordField;