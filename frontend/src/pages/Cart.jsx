import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const BACKEND_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getImageUrl(img) {
  if (!img) return null;
  const url = img.image || img.url || img.src || '';
  if (!url) return null;
  return url.startsWith('http') ? url : `${BACKEND_BASE}${url}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, loading, fetchCart, updateCartItem, removeCartItem } = useCart();

  useEffect(() => { fetchCart(); }, []);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.product?.discount_price || item.product?.price || item.price || 0);
    return sum + price * (item.quantity || 1);
  }, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + shipping;

  const handleQuantity = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty < 1) return;
    try {
      await updateCartItem(item.id, newQty);
    } catch { toast.error('Failed to update quantity'); }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId);
      toast.success('Item removed');
    } catch { toast.error('Failed to remove item'); }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}
          </div>
        </div>
      </>
    );
  }

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl font-bold text-white mb-8">
          Shopping Cart{items.length > 0 && <span className="text-zinc-500 text-xl ml-3 font-normal">({items.length} items)</span>}
        </h1>

        {items.length === 0 ? (
          <EmptyState
            type="cart"
            title="Your cart is empty"
            description="Looks like you haven't added any items yet. Browse our premium baby collection."
            action={<Link to="/products" className="btn-primary inline-flex items-center gap-2 px-6 py-3"><Package className="w-4 h-4" />Browse Products</Link>}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Items List */}
            <div className="flex-1 space-y-4">
              <AnimatePresence>
                {items.map((item) => {
                  const product = item.product || {};
                  const images = product.images || [];
                  const imageUrl = images.length > 0 ? getImageUrl(images[0]) : null;
                  const price = parseFloat(product.discount_price || product.price || item.price || 0);
                  const itemTotal = price * (item.quantity || 1);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      exit={{ opacity: 0, x: -40 }}
                      className="dark-card p-5 flex gap-5"
                    >
                      {/* Image */}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-900 flex-shrink-0">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-zinc-700" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${product.id}`} className="text-white font-semibold text-sm leading-snug hover:text-violet-300 transition-colors line-clamp-2">
                          {product.name || 'Product'}
                        </Link>
                        {product.category?.name && (
                          <p className="text-xs text-violet-400 mt-1">{product.category.name}</p>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 bg-zinc-900 rounded-xl border border-white/[0.06] p-1">
                            <button
                              onClick={() => handleQuantity(item, -1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm text-white">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantity(item, 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-bold text-white">₹{itemTotal.toFixed(2)}</span>
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-error-400 hover:bg-error-500/10 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="dark-card p-6 sticky top-24">
                <h2 className="font-display text-lg font-bold text-white mb-6">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="text-white">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-success-400' : 'text-white'}>
                      {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-zinc-500">
                      Add ₹{(50 - subtotal).toFixed(2)} more for free shipping
                    </p>
                  )}
                </div>

                {/* Coupon */}
                <div className="mt-5 pt-5 border-t border-white/[0.06]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                    />
                    <button className="px-4 py-2 bg-zinc-800 border border-white/[0.08] rounded-xl text-sm text-zinc-300 hover:text-white transition-colors">
                      Apply
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-white/[0.06] flex justify-between text-white font-bold">
                  <span>Total</span>
                  <span className="text-xl">₹{total.toFixed(2)}</span>
                </div>

                <motion.button
                  onClick={() => navigate('/checkout')}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <Link to="/products" className="block text-center text-sm text-zinc-500 hover:text-zinc-300 mt-4 transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </PageTransition>
  );
}
