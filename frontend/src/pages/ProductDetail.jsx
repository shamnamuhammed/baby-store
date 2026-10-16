import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Zap,
  Star,
  Package,
  Shield,
  Truck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';

const BACKEND_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

function getImageUrl(img) {
  const url = img?.image || img?.url || img?.src || '';

  if (!url) {
    return null;
  }

  return url.startsWith('http') ? url : `${BACKEND_BASE}${url}`;
}

function Skeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="skeleton h-[500px] rounded-3xl" />

        <div className="space-y-4">
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton h-8 w-full rounded-xl" />
          <div className="skeleton h-8 w-3/4 rounded-xl" />
          <div className="skeleton h-4 w-32 rounded-full" />
          <div className="skeleton h-10 w-40 rounded-xl" />
          <div className="skeleton h-px w-full" />
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist, fetchWishlist } = useWishlist();

  // Store the product together with the ID it belongs to.
  const [productResult, setProductResult] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);

  // Loading is derived from whether the current ID has been loaded.
  const loading = productResult?.id !== id;
  const product =
    productResult?.id === id ? productResult.product : null;

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/api/products/${id}/`);
        const productData = response.data?.data ?? response.data;

        if (!cancelled) {
          setProductResult({
            id,
            product: productData,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load product:', error);

        setProductResult({
          id,
          product: null,
        });

        navigate('/products', { replace: true });
      }
    };

    void fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  const handleAddToCart = async (showToast = true) => {
    if (!isAuthenticated) {
      toast.error('Please sign in first');
      navigate('/login');
      return false;
    }

    if (!product || product.stock_quantity <= 0) {
      toast.error('This product is currently out of stock.');
      return false;
    }

    setAddingCart(true);

    try {
      await addToCart(product.id, quantity);

      if (showToast) {
        toast.success('Added to cart!');
      }

      return true;
    } catch (error) {
      console.error('Failed to add product to cart:', error);

      if (showToast) {
        toast.error('Failed to add to cart');
      }

      return false;
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in first');
      navigate('/login');
      return;
    }

    const success = await handleAddToCart(false);

    if (success) {
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Skeleton />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Product not found
          </h1>

          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn-primary px-6 py-3 rounded-xl"
          >
            Back to Products
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [];

  const originalPrice = Number(
    product.original_price ?? product.price ?? 0
  );

  const finalPrice = Number(
    product.final_price ?? product.price ?? 0
  );

  const discount = Number(product.discount ?? 0);
  const hasDiscount = discount > 0 && finalPrice < originalPrice;
  const inWishlist = isInWishlist(product.id);

  const currentImage = images[activeImage]
    ? getImageUrl(images[activeImage])
    : null;

  return (
    <PageTransition>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product image gallery */}
          <div className="space-y-4">
            <div className="relative h-[480px] rounded-3xl overflow-hidden border border-white/[0.06] bg-zinc-900">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-zinc-700" />
                </div>
              )}

              {hasDiscount && originalPrice > 0 && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-xl text-sm font-bold text-white bg-gradient-violet">
                  -
                  {Math.round(
                    ((originalPrice - finalPrice) / originalPrice) * 100
                  )}
                  %
                </div>
              )}

              {hasDiscount && product.offer && (
                <p className="absolute bottom-4 left-4 text-sm font-medium text-pink-400">
                  {product.offer}
                </p>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous product image"
                    onClick={() =>
                      setActiveImage((current) =>
                        Math.max(0, current - 1)
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-zinc-950/70 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-zinc-900 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    aria-label="Next product image"
                    onClick={() =>
                      setActiveImage((current) =>
                        Math.min(images.length - 1, current + 1)
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-zinc-950/70 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-zinc-900 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Product thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {images.map((img, index) => {
                  const url = getImageUrl(img);

                  return (
                    <button
                      type="button"
                      key={img.id ?? img.image ?? img.url ?? index}
                      aria-label={`View product image ${index + 1}`}
                      aria-pressed={activeImage === index}
                      onClick={() => setActiveImage(index)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                        activeImage === index
                          ? 'border-violet-500'
                          : 'border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      {url && (
                        <img
                          src={url}
                          alt={`${product.name} view ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product information */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.category?.name && (
                <span className="badge-violet">
                  {product.category.name}
                </span>
              )}

              {product.brand?.name && (
                <span className="badge-zinc">
                  {product.brand.name}
                </span>
              )}

              {product.is_featured && (
                <span className="badge-pink inline-flex items-center">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold text-white leading-tight mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(
                        Number(product.average_rating || 0)
                      )
                        ? 'text-warning-400 fill-current'
                        : 'text-zinc-700'
                    }`}
                  />
                ))}
              </div>

              <span className="text-sm text-zinc-500">
                {product.average_rating
                  ? Number(product.average_rating).toFixed(1)
                  : 'No ratings'}

                {Number(product.review_count) > 0 &&
                  ` (${product.review_count} reviews)`}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4 mb-8">
              <span className="text-3xl font-display font-bold text-white">
                ₹{finalPrice.toFixed(2)}
              </span>

              {hasDiscount && (
                <span className="text-lg text-zinc-500 line-through">
                  ₹{originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* SKU and stock */}
            <div className="flex items-center gap-4 mb-6 text-sm flex-wrap">
              {product.sku && (
                <span className="text-zinc-500">
                  SKU:{' '}
                  <span className="text-zinc-300">{product.sku}</span>
                </span>
              )}

              {product.stock_quantity > 0 ? (
                <span className="text-success-400">
                  ● In Stock ({product.stock_quantity})
                </span>
              ) : (
                <span className="text-error-400">● Out of Stock</span>
              )}
            </div>

            <div className="border-t border-white/[0.06] pt-6 mb-6">
              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm text-zinc-400">Quantity:</span>

                <div className="flex items-center gap-1 bg-zinc-900 rounded-xl border border-white/[0.08] p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors font-bold disabled:opacity-40"
                  >
                    −
                  </button>

                  <span className="w-8 text-center text-sm text-white font-medium">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={
                      quantity >= Number(product.stock_quantity || 0)
                    }
                    onClick={() =>
                      setQuantity((current) =>
                        Math.min(
                          Number(product.stock_quantity || 0),
                          current + 1
                        )
                      )
                    }
                    className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cart, Buy Now, and Wishlist */}
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => void handleAddToCart()}
                  disabled={addingCart || product.stock_quantity <= 0}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white btn-primary disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingCart ? 'Adding...' : 'Add to Cart'}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => void handleBuyNow()}
                  disabled={addingCart || product.stock_quantity <= 0}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5" />
                  Buy Now
                </motion.button>

                <motion.button
                  type="button"
                  aria-label={
                    inWishlist
                      ? 'Remove from wishlist'
                      : 'Add to wishlist'
                  }
                  aria-pressed={inWishlist}
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error('Please sign in first');
                      navigate('/login');
                      return;
                    }

                    void toggleWishlist(product.id);
                  }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 shrink-0 rounded-xl border flex items-center justify-center transition-all ${
                    inWishlist
                      ? 'bg-pink-500/15 border-pink-500/40 text-pink-400'
                      : 'border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:border-pink-500/40 hover:text-pink-400'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      inWishlist ? 'fill-current' : ''
                    }`}
                  />
                </motion.button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: 'Safe & Certified' },
                { icon: Truck, label: 'Free Shipping' },
                { icon: Package, label: '30-Day Returns' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04] text-center"
                >
                  <Icon className="w-5 h-5 text-violet-400" />
                  <span className="text-xs text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product description */}
        {product.description && (
          <div className="mt-16 border-t border-white/[0.06] pt-12">
            <h2 className="font-display text-2xl font-bold text-white mb-6">
              Product Description
            </h2>

            <div className="prose prose-invert max-w-none">
              <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {product.weight && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Weight', value: `${product.weight}kg` },
                  { label: 'SKU', value: product.sku },
                  {
                    label: 'Category',
                    value: product.category?.name,
                  },
                  { label: 'Brand', value: product.brand?.name },
                ]
                  .filter((detail) => detail.value)
                  .map(({ label, value }) => (
                    <div key={label} className="dark-card p-4">
                      <p className="text-xs text-zinc-500 mb-1">
                        {label}
                      </p>
                      <p className="text-sm text-white font-medium">
                        {value}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </PageTransition>
  );
}