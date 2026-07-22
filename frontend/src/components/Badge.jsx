import React from 'react';

const variants = {
  violet: 'badge-violet',
  pink: 'badge-pink',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  zinc: 'badge-zinc',
};

const orderStatusMap = {
  pending: { variant: 'warning', label: 'Pending' },
  processing: { variant: 'violet', label: 'Processing' },
  shipped: { variant: 'violet', label: 'Shipped' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'error', label: 'Cancelled' },
  refunded: { variant: 'zinc', label: 'Refunded' },
};

const paymentStatusMap = {
  pending: { variant: 'warning', label: 'Pending' },
  completed: { variant: 'success', label: 'Paid' },
  failed: { variant: 'error', label: 'Failed' },
  refunded: { variant: 'zinc', label: 'Refunded' },
};

export default function Badge({ variant = 'violet', children, className = '', icon: Icon }) {
  return (
    <span className={`${variants[variant] || variants.zinc} ${className}`}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const cfg = orderStatusMap[status?.toLowerCase()] || { variant: 'zinc', label: status || 'Unknown' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function PaymentStatusBadge({ status }) {
  const cfg = paymentStatusMap[status?.toLowerCase()] || { variant: 'zinc', label: status || 'Unknown' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
