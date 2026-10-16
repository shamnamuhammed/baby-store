import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Zap, Star, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BACKEND_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getImageUrl(images) {
  if (!images || images.length === 0) return null;
  const img = images[0];
  const url = img.image || img.url || img.src || '';
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_BASE}${url}`;
}

function DiscountBadge({ price, discountPrice }) {
  if (!discountPrice || parseFloat(discountPrice) >= parseFloat(price)) return null;
  const pct = Math.round(((price - discountPrice) / price) * 100);
  return (
    <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[11px] font-bold text-white rounded-lg"
      style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' }}>
      -{pct}%
    </span>
  );
}

export default function ProductCard({ product, onWishlistToggle, isWishlisted = false }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const imageUrl = getImageUrl(product.images);
  const originalPrice = Number(
    product.original_price ?? product.price ?? 0
  );

  const displayPrice = Number(
    product.final_price ?? product.price ?? 0
  );

  const hasDiscount = displayPrice < originalPrice;
  const categoryName = product.category?.name || product.category || 'Baby';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      navigate('/login');
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to use wishlist');
      navigate('/login');
      return;
    }
    if (!onWishlistToggle) return;
    setWishlistLoading(true);
    try {
      await onWishlistToggle(product.id);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/products/${product.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="group relative"
    >
      <Link to={`/products/${product.id}`} className="block">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] transition-all duration-300 group-hover:border-violet-500/30"
          style={{
            background: '#18181B',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {/* Image Container */}
          <div className="relative h-56 overflow-hidden img-zoom-container bg-zinc-900">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-zinc-600" />
                </div>
              </div>
            )}

            {/* Discount Badge */}
              <DiscountBadge
                price={originalPrice}
                discountPrice={displayPrice}
              />
            {/* Featured Badge */}
            {product.is_featured && (
              <span className="absolute top-3 right-3 z-10 badge-violet">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}

            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`absolute top-3 ${product.is_featured ? 'right-20' : 'right-3'} z-10 w-9 h-9 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
                isWishlisted
                  ? 'bg-pink-500/20 border border-pink-500/40 text-pink-400'
                  : 'bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''} ${wishlistLoading ? 'animate-pulse' : ''}`} />
            </button>

            {/* Hover Overlay with actions */}
            <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3 gap-2">
              <motion.button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock_quantity === 0}
                whileTap={{ scale: 0.96 }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
              >
                <ShoppingCart className="w-4 h-4" />
                {addingToCart ? 'Adding...' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </motion.button>
              <motion.button
                onClick={handleBuyNow}
                whileTap={{ scale: 0.96 }}
                className="w-10 h-10 rounded-xl bg-zinc-800/90 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-violet-500/40 transition-all"
              >
                <Zap className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4">
            {/* Category */}
            <p className="text-xs text-violet-400 font-medium mb-1.5 truncate">{categoryName}</p>

            {/* Name */}
            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-2 group-hover:text-violet-200 transition-colors">
              {product.name}
            </h3>

            {/* Stars placeholder */}

{/* Product Rating */}
{(() => {
  const averageRating = Number(
    product.average_rating ??
    product.rating_average ??
    product.rating ??
    0
  );

  const reviewCount = Number(
    product.review_count ??
    product.reviews_count ??
    product.total_reviews ??
    0
  );

  const hasRatings = reviewCount > 0 && averageRating > 0;

  return (
    <div
      className="flex items-center gap-1 mb-3"
      aria-label={
        hasRatings
          ? `${averageRating.toFixed(1)} out of 5, ${reviewCount} reviews`
          : 'No ratings yet'
      }
    >
      {hasRatings ? (
        <>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 ${
                star <= Math.round(averageRating)
                  ? 'text-warning-400 fill-current'
                  : 'text-zinc-700'
              }`}
            />
          ))}

          <span className="text-xs text-zinc-300 ml-1">
            {averageRating.toFixed(1)}
          </span>

          <span className="text-xs text-zinc-500">
            ({reviewCount})
          </span>
        </>
      ) : (
        <span className="text-xs text-zinc-500">
          No ratings yet
        </span>
      )}
    </div>
  );
})()}


            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">₹{parseFloat(displayPrice).toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-xs text-zinc-500 line-through">
                      ₹{originalPrice.toFixed(2)}
                    </span>
                )}
                  {hasDiscount && product.offer && (
                  <p className="mt-1 text-xs font-semibold text-pink-500">
                    {product.offer}
                  </p>
                )}
              </div>
              {product.stock_quantity === 0 ? (
                <span className="text-xs text-error-400 font-medium">Out of stock</span>
              ) : product.stock_quantity <= 5 ? (
                <span className="text-xs text-warning-400 font-medium">Only {product.stock_quantity} left</span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
