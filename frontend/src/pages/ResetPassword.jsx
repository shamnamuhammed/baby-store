import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Sparkles, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../utils/axios';
import InputField from '../components/InputField';
import LoadingButton from '../components/LoadingButton';
import FormError from '../components/FormError';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users/reset-password/', { token, new_password: data.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#09090B' }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(139,92,246,0.12) 0%, transparent 70%)'
      }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
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
            {!success ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-display text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-zinc-400 text-sm mb-6">Enter your new password below.</p>

                <FormError message={error} onClose={() => setError('')} />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                  <div className="relative">
                    <InputField
                      id="password" label="New Password" type={showPass ? 'text' : 'password'}
                      placeholder="••••••••" icon={Lock} required
                      error={errors.password} isValid={watch('password') && !errors.password}
                      {...register('password')}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-[38px] p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <InputField
                      id="confirm_password" label="Confirm Password" type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••" icon={Lock} required
                      error={errors.confirm_password} isValid={watch('confirm_password') && !errors.confirm_password}
                      {...register('confirm_password')}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[38px] p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <LoadingButton loading={loading} disabled={!isValid || loading}>
                    Reset Password
                  </LoadingButton>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-16 h-16 rounded-3xl bg-success-500/15 border border-success-500/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-success-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">Password Reset!</h3>
                <p className="text-zinc-400 text-sm">Your password has been successfully reset. Redirecting...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
