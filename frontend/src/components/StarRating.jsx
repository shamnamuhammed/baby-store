import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, max = 5, size = 'sm', showValue = false }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const iconSize = sizes[size] || sizes.sm;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${i < Math.floor(rating) ? 'text-warning-400 fill-current' : 'text-zinc-700'}`}
        />
      ))}
      {showValue && (
        <span className="text-xs text-zinc-400 ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
