import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Package, Search, Inbox } from 'lucide-react';

const icons = {
  cart: ShoppingCart,
  wishlist: Heart,
  orders: Package,
  search: Search,
  default: Inbox,
};

export default function EmptyState({ type = 'default', title, description, action }) {
  const Icon = icons[type] || icons.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
          <Icon className="w-10 h-10 text-zinc-600" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 blur-xl -z-10" />
      </div>

      <h3 className="font-display text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">{description}</p>

      {action && (
        <div className="mt-8">{action}</div>
      )}
    </motion.div>
  );
}
