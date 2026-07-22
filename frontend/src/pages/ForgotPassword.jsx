import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../utils/axios';
import InputField from '../components/InputField';
import LoadingButton from '../components/LoadingButton';
import FormError from '../components/FormError';

const schema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users/forgot-password/', data);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#09090B' }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(139,92,246,0.12) 0%, transparent 70%)'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-violet flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">
            Lil<span className="text-gradient-violet">Bunny</span>
          </span>
        </div>

        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-violet-400" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">Forgot password?</h2>
                  <p className="text-zinc-400 text-sm mt-1">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <FormError message={error} onClose={() => setError('')} />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
                  <InputField
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="parent@example.com"
                    icon={Mail}
                    required
                    error={errors.email}
                    isValid={watch('email') && !errors.email}
                    {...register('email')}
                  />
                  <LoadingButton loading={loading} loadingText="Sending..." disabled={!isValid || loading}>
                    Send Reset Link
                  </LoadingButton>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 rounded-3xl bg-success-500/15 border border-success-500/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-success-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">Check your email</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  We've sent a password reset link to your email address.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
