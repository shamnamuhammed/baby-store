import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const BACKEND_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

function getImageUrl(img) {
  if (!img) return null;

  const url = img.image || img.url || img.src || '';

  if (!url) return null;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${BACKEND_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const [initialCartLoading, setInitialCartLoading] = React.useState(true);

  const {
    cart,
    loading,
    fetchCart,
    updateCartItem,
    removeCartItem,
  } = useCart();

useEffect(() => {
  let active = true;

  const loadInitialCart = async () => {
    try {
      await fetchCart();
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      if (active) {
        setInitialCartLoading(false);
      }
    }
  };

  void loadInitialCart();

  return () => {
    active = false;
  };

  // Fetch once when the Cart page mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const items = Array.isArray(cart?.items) ? cart.items : [];

  // The backend remains the source of truth for all cart totals.
  const subtotal = Number(cart?.subtotal ?? 0);
  const offerDiscount = Number(cart?.offer_discount ?? 0);
  const couponDiscount = Number(cart?.coupon_discount ?? 0);
  const total = Number(cart?.total ?? 0);

  const handleQuantity = async (item, delta) => {
    const currentQuantity = Number(item.quantity ?? 1);
    const newQuantity = currentQuantity + delta;

    if (newQuantity < 1) return;

    if (
      item.available_stock != null &&
      newQuantity > Number(item.available_stock)
    ) {
      toast.error('Requested quantity exceeds available stock.');
      return;
    }

    try {
      await updateCartItem(item.id, newQuantity);
    } catch {
      toast.error('Failed to update quantity.');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId);
      toast.success('Item removed from cart.');
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  if (initialCartLoading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="skeleton h-28 w-full rounded-2xl"
              />
            ))}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <PageTransition>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl font-bold text-white mb-8">
          Shopping Cart
          {items.length > 0 && (
            <span className="text-zinc-500 text-xl ml-3 font-normal">
              ({items.length} items)
            </span>
          )}
        </h1>

        {items.length === 0 ? (
          <EmptyState
            type="cart"
            title="Your cart is empty"
            description="Looks like you haven't added any items yet. Browse our premium baby collection."
            action={
              <Link
                to="/products"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                <Package className="w-4 h-4" />
                Browse Products
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart items */}
            <div className="flex-1 space-y-4">
              <AnimatePresence>
                {items.map((item) => {
                  const product = item.product || {};
                  const images = Array.isArray(product.images)
                    ? product.images
                    : [];

                  const imageUrl =
                    images.length > 0
                      ? getImageUrl(images[0])
                      : null;

                  const quantity = Number(item.quantity ?? 1);

                  const originalPrice = Number(
                    item.unit_price ?? product.price ?? item.price ?? 0
                  );

                  const finalPrice = Number(
                    item.final_price ?? originalPrice
                  );

                  const itemTotal = Number(
                    item.subtotal ?? finalPrice * quantity
                  );

                  const hasDiscount = finalPrice < originalPrice;

                  return (
                    <motion.div
                      key={item.id}

                      exit={{ opacity: 0, x: -40 }}
                      className="dark-card p-5 flex gap-5"
                    >
                      {/* Product image */}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-900 flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-zinc-700" />
                          </div>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${product.id}`}
                          className="text-white font-semibold text-sm leading-snug hover:text-violet-300 transition-colors line-clamp-2"
                        >
                          {product.name || 'Product'}
                        </Link>

                        {product.category?.name && (
                          <p className="text-xs text-violet-400 mt-1">
                            {product.category.name}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-1 bg-zinc-900 rounded-xl border border-white/[0.06] p-1">
                            <button
                              type="button"
                              onClick={() => handleQuantity(item, -1)}
                              disabled={quantity <= 1}
                              aria-label={`Decrease quantity of ${product.name || 'product'}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="w-6 text-center text-sm text-white">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleQuantity(item, 1)}
                              disabled={
                                item.available_stock != null &&
                                quantity >= Number(item.available_stock)
                              }
                              aria-label={`Increase quantity of ${product.name || 'product'}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Item price and remove action */}
                          <div className="flex items-center gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-white">
                                ₹{itemTotal.toFixed(2)}
                              </span>

                              {hasDiscount && (
                                <span className="text-xs text-zinc-500 line-through">
                                  ₹{(originalPrice * quantity).toFixed(2)}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemove(item.id)}
                              aria-label={`Remove ${product.name || 'product'} from cart`}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-error-400 hover:bg-error-500/10 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {item.stock_valid === false && (
                          <p className="text-xs text-red-400 mt-2">
                            Please review the available stock for this item.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Order summary */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="dark-card p-6 sticky top-24">
                <h2 className="font-display text-lg font-bold text-white mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="text-white">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  {offerDiscount > 0 && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Offer discount</span>
                      <span className="text-green-400">
                        −₹{offerDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Coupon discount</span>
                      <span className="text-green-400">
                        −₹{couponDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-white/[0.06] flex justify-between text-white font-bold">
                  <span>Total</span>
                  <span className="text-xl">
                    ₹{total.toFixed(2)}
                  </span>
                </div>

                <motion.button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <Link
                  to="/products"
                  className="block text-center text-sm text-zinc-500 hover:text-zinc-300 mt-4 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </PageTransition>
  );
}