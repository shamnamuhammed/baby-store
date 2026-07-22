import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function NotFound() {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(139,92,246,0.15) 0%, transparent 70%)'
        }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-violet flex items-center justify-center shadow-glow-violet mx-auto mb-8">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="font-display text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-4 tracking-tighter">
            404
          </h1>
          
          <h2 className="font-display text-2xl font-bold text-white mb-4">
            Oops! Page not found
          </h2>
          
          <p className="text-zinc-400 text-sm mb-10 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-8 py-4">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
}
