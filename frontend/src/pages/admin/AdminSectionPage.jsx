
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Construction,
  LayoutDashboard,
} from 'lucide-react';

const sections = {
  products: {
    title: 'Product management',
    description: 'Manage product details, pricing, inventory and product images.',
    endpoint: '/api/admin/products/',
  },
  categories: {
    title: 'Category management',
    description: 'Organize products into store categories.',
    endpoint: '/api/admin/products/categories/',
  },
  brands: {
    title: 'Brand management',
    description: 'Manage the brands displayed in your store.',
    endpoint: '/api/admin/products/brands/',
  },
  orders: {
    title: 'Order management',
    description: 'Review customer orders and manage their processing status.',
    endpoint: '/api/admin/orders/',
  },
  customers: {
    title: 'Customer management',
    description: 'Review customer accounts and account status.',
    endpoint: '/api/users/',
  },
  payments: {
    title: 'Payment management',
    description: 'Review payment-related information from the backend.',
    endpoint: '/api/admin/payments/',
  },
  coupons: {
    title: 'Coupon management',
    description: 'Manage promotional coupons and discount rules.',
    endpoint: '/api/admin/coupons/',
  },
  offers: {
    title: 'Offer management',
    description: 'Manage product and category offers.',
    endpoint: '/api/admin/offers/',
  },
};

export default function AdminSectionPage() {
  const location = useLocation();
  const sectionKey = location.pathname.split('/').filter(Boolean).at(-1);
  const section = sections[sectionKey];

  if (!section) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-8">
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <Link
          to="/admin"
          className="mt-4 inline-flex items-center gap-2 text-sm text-violet-300"
        >
          <ArrowLeft size={16} />
          Return to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-6 sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Construction size={28} />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Admin module
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          {section.title}
        </h1>

        <p className="mt-3 leading-7 text-zinc-400">
          {section.description}
        </p>

        <div className="mt-7 rounded-xl border border-white/[0.08] bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Existing backend endpoint
          </p>
          <code className="mt-2 block break-all text-sm text-emerald-300">
            {section.endpoint}
          </code>
        </div>

        <div className="mt-6 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-4">
          <p className="text-sm font-semibold text-amber-200">
            Frontend module not implemented yet
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            The navigation and backend endpoint reference are ready, but this
            management screen still needs its own API integration, forms,
            validation, loading states and error handling.
          </p>
        </div>

        <Link
          to="/admin"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          <LayoutDashboard size={17} />
          Return to dashboard
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
