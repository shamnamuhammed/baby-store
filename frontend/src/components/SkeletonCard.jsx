import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.04]" style={{ background: '#18181B' }}>
      {/* Image */}
      <div className="skeleton h-56 w-full" />
      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="flex items-center justify-between mt-2">
          <div className="skeleton h-6 w-20 rounded-lg" />
          <div className="skeleton h-8 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
