import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { motion } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import LoadingButton from '../components/LoadingButton';
import FormError from '../components/FormError';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const features = [
  { title: 'Safe & Organic', desc: 'Every product is certified safe for babies' },
  { title: 'Premium Quality', desc: 'Curated top-tier baby essentials' },
  { title: 'Fast Delivery', desc: 'Free shipping on orders over ₹50' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    console.log(data);
    setLoading(true);
    setGeneralError('');
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      const err = error.response?.data;
      setGeneralError(err?.message || err?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#09090B' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 70% at 30% 30%, rgba(139,92,246,0.2) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 70% 70%, rgba(236,72,153,0.12) 0%, transparent 60%), #09090B'
          }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white tracking-tight">
            Lil<span className="text-gradient-violet">Bunny</span>
          </span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
              Premium baby products,<br />
              <span className="text-gradient-violet">delivered with care</span>
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed mb-10">
              Join thousands of parents who trust LilBunny for safe, beautiful baby essentials.
            </p>

            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-violet" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{f.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <p className="relative z-10 text-xs text-zinc-600">
          © {new Date().getFullYear()} LilBunny Inc. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
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

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-white">Welcome back</h2>
            <p className="text-zinc-400 mt-2 text-sm">Sign in to your LilBunny account</p>
          </div>

          <FormError message={generalError} onClose={() => setGeneralError('')} />

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
              disabled={loading}
              {...register('email')}
            />

            <div className="relative">
              <InputField
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                required
                error={errors.password}
                isValid={watch('password') && !errors.password}
                disabled={loading}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <LoadingButton loading={loading} loadingText="Signing in..." disabled={!isValid || loading}>
              Sign In
            </LoadingButton>
          </form>

          <div className="divider mt-8 mb-6">
            <span>or continue with</span>
          </div>

          {/* Social placeholders */}
          <div className="grid grid-cols-2 gap-3">
            {['Google', 'Apple'].map((p) => (
              <button key={p} className="btn-ghost flex items-center justify-center gap-2 py-3 text-sm">
                {p}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-zinc-500 mt-8">
            New to LilBunny?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1 transition-colors">
              Create account
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
