import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import PageTransition from '../components/PageTransition';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      navigate('/');
      return;
    }
    
    // Confetti celebration
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8B5CF6', '#EC4899', '#4ADE80']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8B5CF6', '#EC4899', '#4ADE80']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [order, navigate]);

  if (!order) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full dark-card p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-success-500/15 border border-success-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success-400" />
          </div>
          
          <h1 className="font-display text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
          <p className="text-zinc-400 text-sm mb-8">
            Thank you for shopping with LilBunny. Your order <span className="text-white font-medium">#{order.id}</span> has been placed successfully.
          </p>

          <div className="bg-zinc-900 rounded-xl p-4 mb-8 text-left border border-white/[0.04]">
            <p className="text-xs text-zinc-500 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-white mb-4">₹{parseFloat(order.total_amount).toFixed(2)}</p>
            
            <p className="text-xs text-zinc-500 mb-1">Status</p>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">
              Processing
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link to={`/orders/${order.id}`} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> View Order Details
            </Link>
            <Link to="/products" className="btn-ghost w-full py-3.5 flex items-center justify-center gap-2">
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
