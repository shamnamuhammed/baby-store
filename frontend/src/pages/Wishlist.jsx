
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Trash2,
  Package,
  ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/EmptyState';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../context/CartContext';

const BACKEND_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

function getImageUrl(image) {
  const url =
    typeof image === 'string'
      ? image
      : image?.image || image?.url || image?.src || '';

  if (!url) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) {
    return url;
  }

  return `${BACKEND_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getWishlistImage(item, product) {
  const productImages = Array.isArray(product.images)
    ? product.images
    : [];

  const image = item.image || productImages[0];

  return getImageUrl(image);
}

export default function Wishlist() {
  const {
    wishlist,
    loading,
    fetchWishlist,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  useEffect(() => {
    void fetchWishlist();
  }, [fetchWishlist]);

  const handleMoveToCart = async (item) => {
    const productId = item.product?.id;

    if (!productId) {
      toast.error('Unable to identify this product.');
      return;
    }

    try {
      await addToCart(productId, 1);
      await removeFromWishlist(item.id, productId);
      toast.success('Moved to cart!');
    } catch {
      toast.error('Failed to move to cart');
    }
  };

  const handleRemove = async (item) => {
    const productId = item.product?.id;

    try {
      await removeFromWishlist(item.id, productId);
    } catch {
      toast.error('Failed to remove item from wishlist');
    }
  };

  const handleClearWishlist = async () => {
    try {
      await clearWishlist();
    } catch {
      toast.error('Failed to clear wishlist');
    }
  };

  return (
    <PageTransition>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              My Wishlist

              {wishlist.length > 0 && (
                <span className="text-zinc-500 text-xl ml-3 font-normal">
                  ({wishlist.length})
                </span>
              )}
            </h1>

            <p className="text-zinc-400 text-sm mt-1">
              Items you&apos;ve saved for later
            </p>
          </div>

          {wishlist.length > 0 && (
            <button
              type="button"
              onClick={() => void handleClearWishlist()}
              className="text-sm text-zinc-400 hover:text-error-400 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="skeleton h-72 rounded-2xl"
              />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState
            type="wishlist"
            title="Your wishlist is empty"
            description="Save your favourite baby products here and come back to them anytime."
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
          /* Wishlist products */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {wishlist.map((item) => {
                const product = item.product || {};
                const imageUrl = getWishlistImage(item, product);

                const originalPrice = Number(
                  product.original_price ?? product.price ?? 0
                );

                const price = Number(
                  product.final_price ??
                    product.discount_price ??
                    product.price ??
                    0
                );

                const hasDiscount =
                  originalPrice > 0 && price < originalPrice;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="dark-card overflow-hidden group"
                  >
                    {/* Product image */}
                    <div className="relative h-52 overflow-hidden bg-zinc-900 img-zoom-container">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name || 'Wishlist product'}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-zinc-700" />
                        </div>
                      )}

                      {/* Remove from wishlist */}
                      <button
                        type="button"
                        aria-label={`Remove ${
                          product.name || 'product'
                        } from wishlist`}
                        onClick={() => void handleRemove(item)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-zinc-950/70 backdrop-blur border border-white/10 flex items-center justify-center text-pink-400 hover:bg-pink-500/15 transition-all"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Product information */}
                    <div className="p-4">
                      {product.category?.name && (
                        <p className="text-xs text-violet-400 mb-1">
                          {product.category.name}
                        </p>
                      )}

                      {product.id ? (
                        <Link to={`/products/${product.id}`}>
                          <h3 className="text-sm font-semibold text-white hover:text-violet-300 transition-colors line-clamp-2 mb-3">
                            {product.name || 'View product'}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-white mb-3">
                          {product.name || 'Product unavailable'}
                        </h3>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-white">
                          ₹{price.toFixed(2)}
                        </span>

                        {hasDiscount && (
                          <span className="text-xs text-zinc-500 line-through">
                            ₹{originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Move to cart */}
                      <button
                        type="button"
                        disabled={!product.id}
                        onClick={() => void handleMoveToCart(item)}
                        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Move to Cart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </PageTransition>
  );
}
