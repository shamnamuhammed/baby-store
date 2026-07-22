import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Package, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/EmptyState';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const BACKEND_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
function getImageUrl(img) {
  const url = img?.image || img?.url || img?.src || '';
  if (!url) return null;
  return url.startsWith('http') ? url : `${BACKEND_BASE}${url}`;
}

export default function Wishlist() {
  const { wishlist, loading, fetchWishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => { fetchWishlist(); }, []);

  const handleMoveToCart = async (item) => {
    const productId = item.product?.id || item.image;
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(item.id, productId);
      toast.success('Moved to cart!');
    } catch {
      toast.error('Failed to move to cart');
    }
  };

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              My Wishlist
              {wishlist.length > 0 && <span className="text-zinc-500 text-xl ml-3 font-normal">({wishlist.length})</span>}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Items you've saved for later</p>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-sm text-zinc-400 hover:text-error-400 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton h-72 rounded-2xl" />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState
            type="wishlist"
            title="Your wishlist is empty"
            description="Save your favourite baby products here and come back to them anytime."
            action={<Link to="/products" className="btn-primary inline-flex items-center gap-2 px-6 py-3"><Package className="w-4 h-4" />Browse Products</Link>}
          />
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {wishlist.map((item) => {
                const product = item.product || {};
                const images = product.images || [];
                const imageUrl = item.image
                  ? `${BACKEND_BASE}${item.image}`
                  : null;
                const price = parseFloat(product.discount_price || product.price || 0);
                const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="dark-card overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden bg-zinc-900 img-zoom-container">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-zinc-700" />
                        </div>
                      )}
                      {/* Remove from wishlist */}
                      <button
                        onClick={() => removeFromWishlist(item.id, product.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-zinc-950/70 backdrop-blur border border-white/10 flex items-center justify-center text-pink-400 hover:bg-pink-500/15 transition-all"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-xs text-violet-400 mb-1">{product.category?.name}</p>
                      <Link to={`/products/${product.id}`}>
                        <h3 className="text-sm font-semibold text-white hover:text-violet-300 transition-colors line-clamp-2 mb-3">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-white">₹{price.toFixed(2)}</span>
                          {hasDiscount && (
                            <span className="text-xs text-zinc-500 line-through ml-2">₹{parseFloat(product.price).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white btn-primary"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Move to Cart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </main>
      <Footer />
    </PageTransition>
  );
}
