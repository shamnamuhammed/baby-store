import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <footer className="bg-zinc-950 border-t border-white/[0.06] mt-20">
      {/* Newsletter Strip */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                Get exclusive baby deals
              </h3>
              <p className="text-zinc-400 mt-1 text-sm">
                Join 50,000+ parents. Premium products, delivered with care.
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>
              <button type="submit" className="btn-primary flex items-center gap-2 py-3 whitespace-nowrap">
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-violet flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Lil<span className="text-gradient-violet">Bunny</span>
              </span>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
              Premium baby products curated with love. Safe, organic, and beautifully designed for your little one.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { Icon: Instagram, href: '#' },
                { Icon: Twitter, href: '#' },
                { Icon: Facebook, href: '#' },
                { Icon: Youtube, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-3">
              {[
                { label: 'All Products', to: '/products' },
                { label: 'New Arrivals', to: '/products?sort=newest' },
                { label: 'Best Sellers', to: '/products?sort=popular' },
                { label: 'Featured', to: '/products?featured=true' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-3">
              {[
                { label: 'My Profile', to: '/profile' },
                { label: 'My Orders', to: '/orders' },
                { label: 'Wishlist', to: '/wishlist' },
                { label: 'Cart', to: '/cart' },
                { label: 'Addresses', to: '/addresses' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3">
              {['Contact Us', 'FAQs', 'Shipping Policy', 'Returns', 'Privacy Policy', 'Terms of Service'].map((label) => (
                <li key={label}>
                  <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">
            © {new Date().getFullYear()} LilBunny Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {['Visa', 'Mastercard', 'PayPal', 'Stripe'].map((p) => (
              <span key={p} className="px-2.5 py-1 text-[10px] font-medium text-zinc-500 bg-zinc-900 border border-white/[0.04] rounded-lg">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
