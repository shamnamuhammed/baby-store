import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Sparkles, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import api from '../utils/axios';
import { registerSchema } from '../schemas/registerSchema';
import InputField from '../components/InputField';
import LoadingButton from '../components/LoadingButton';
import FormError from '../components/FormError';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', ok: password?.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password || '') },
    { label: 'Number', ok: /\d/.test(password || '') },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password || '') },
  ];
  const strength = checks.filter((c) => c.ok).length;
  const colors = ['bg-zinc-700', 'bg-error-500', 'bg-warning-400', 'bg-violet-500', 'bg-success-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= i ? colors[strength] : 'bg-zinc-800'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium ${['', 'text-error-400', 'text-warning-400', 'text-violet-400', 'text-success-400'][strength]}`}>
          {labels[strength]}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end">
          {checks.map((c) => (
            <span key={c.label} className={`text-[10px] flex items-center gap-1 ${c.ok ? 'text-success-400' : 'text-zinc-600'}`}>
              <CheckCircle2 className="w-3 h-3" />
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      username: '', first_name: '', last_name: '',
      email: '', phone_number: '', password: '', confirm_password: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setGeneralError('');
    try {
      const res = await api.post('/api/users/register/', {
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone_number,
        password: data.password,
        confirm_password: data.confirm_password,
      });

      if (res.data?.success || res.status === 201) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#8B5CF6', '#EC4899', '#A78BFA', '#F472B6'] });
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      const errData = error.response?.data;
      if (errData) {
        let fieldFound = false;
        ['username', 'first_name', 'last_name', 'email', 'phone_number', 'password', 'confirm_password'].forEach((key) => {
          if (errData[key]) {
            setError(key, { type: 'server', message: Array.isArray(errData[key]) ? errData[key][0] : errData[key] });
            fieldFound = true;
          }
        });
        if (!fieldFound) setGeneralError(errData.message || 'Registration failed. Please try again.');
      } else {
        setGeneralError('Unable to connect. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#09090B' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 70% at 30% 40%, rgba(139,92,246,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 70% 80%, rgba(236,72,153,0.1) 0%, transparent 60%), #09090B'
        }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white">
            Lil<span className="text-gradient-violet">Bunny</span>
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-3xl font-bold text-white leading-tight mb-3">
            Start your journey<br />
            <span className="text-gradient-violet">as a LilBunny parent</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Create your account and access thousands of premium, safe baby products.
          </p>

          <div className="space-y-4">
            {[
              { stat: '50,000+', label: 'Happy Parents' },
              { stat: '2,000+', label: 'Premium Products' },
              { stat: '4.9★', label: 'Average Rating' },
            ].map(({ stat, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-12 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-violet-400">{stat}</span>
                </div>
                <span className="text-sm text-zinc-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-600">© {new Date().getFullYear()} LilBunny Inc.</p>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg py-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-violet flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Lil<span className="text-gradient-violet">Bunny</span>
            </span>
          </div>

          {/* Success Screen */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-3xl bg-success-500/15 border border-success-500/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-success-400" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">Account Created!</h2>
                <p className="text-zinc-400 text-sm">Redirecting you to sign in...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold text-white">Create account</h2>
                <p className="text-zinc-400 mt-2 text-sm">Join LilBunny — takes less than a minute</p>
              </div>

              <FormError message={generalError} onClose={() => setGeneralError('')} />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
                <InputField
                  id="username"
                  label="Username"
                  placeholder="babylover2024"
                  icon={User}
                  required
                  error={errors.username}
                  isValid={watch('username') && !errors.username}
                  disabled={loading}
                  {...register('username')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    id="first_name"
                    label="First Name"
                    placeholder="Emma"
                    required
                    error={errors.first_name}
                    isValid={watch('first_name') && !errors.first_name}
                    disabled={loading}
                    {...register('first_name')}
                  />
                  <InputField
                    id="last_name"
                    label="Last Name"
                    placeholder="Watson"
                    required
                    error={errors.last_name}
                    isValid={watch('last_name') && !errors.last_name}
                    disabled={loading}
                    {...register('last_name')}
                  />
                </div>

                <InputField
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="parent@example.com"
                  icon={Mail}
                  required
                  error={errors.email}
                  isValid={watch('email') && !errors.email}
                  disabled={loading}
                  {...register('email')}
                />

                <InputField
                  id="phone_number"
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  icon={Phone}
                  required
                  error={errors.phone_number}
                  isValid={watch('phone_number') && !errors.phone_number}
                  disabled={loading}
                  {...register('phone_number')}
                />

                <div>
                  <div className="relative">
                    <InputField
                      id="password"
                      label="Password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      icon={Lock}
                      required
                      error={errors.password}
                      disabled={loading}
                      {...register('password')}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-[38px] p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={passwordValue} />
                </div>

                <div className="relative">
                  <InputField
                    id="confirm_password"
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    icon={Lock}
                    required
                    error={errors.confirm_password}
                    isValid={watch('confirm_password') && !errors.confirm_password}
                    disabled={loading}
                    {...register('confirm_password')}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-[38px] p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input id="terms" type="checkbox" required
                    className="mt-1 w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-violet-500 focus:ring-violet-500/40 cursor-pointer" />
                  <label htmlFor="terms" className="text-xs text-zinc-400 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-violet-400 hover:text-violet-300 underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-violet-400 hover:text-violet-300 underline">Privacy Policy</a>
                  </label>
                </div>

                <div className="pt-2">
                  <LoadingButton loading={loading} loadingText="Creating account..." disabled={!isValid || loading}>
                    Create Account
                  </LoadingButton>
                </div>
              </form>

              <p className="text-center text-sm text-zinc-500 mt-8">
                Already have an account?{' '}
                <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1">
                  Sign in <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
