import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Zap, Star, Package, Shield, Truck, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { OrderStatusBadge } from '../components/Badge';
import toast from 'react-hot-toast';

const BACKEND_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getImageUrl(img) {
  const url = img?.image || img?.url || img?.src || '';
  if (!url) return null;
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

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/products/${id}/`);
        setProduct(res.data?.data || res.data);
      } catch {
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
    fetchWishlist();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in first'); navigate('/login'); return; }
    setAddingCart(true);
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    await handleAddToCart();
    navigate('/cart');
  };

  if (loading) return <><Navbar /><Skeleton /></>;
  if (!product) return null;

  const images = product.images || [];
  const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price);
  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const discount = hasDiscount ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0;
  const inWishlist = isInWishlist(product.id);
  const currentImage = images[activeImage] ? getImageUrl(images[activeImage]) : null;

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-[480px] rounded-3xl overflow-hidden border border-white/[0.06] bg-zinc-900">
              {currentImage ? (
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-zinc-700" />
                </div>
              )}
              {hasDiscount && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-xl text-sm font-bold text-white bg-gradient-violet">
                  -{discount}%
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(Math.max(0, activeImage - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-zinc-950/70 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-zinc-900 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setActiveImage(Math.min(images.length - 1, activeImage + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-zinc-950/70 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-zinc-900 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => {
                  const url = getImageUrl(img);
                  return (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-violet-500' : 'border-white/[0.06] hover:border-white/20'}`}>
                      {url && <img src={url} alt="" className="w-full h-full object-cover" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category & Brand */}
            <div className="flex items-center gap-2 mb-3">
              {product.category?.name && (
                <span className="badge-violet">{product.category.name}</span>
              )}
              {product.brand?.name && (
                <span className="badge-zinc">{product.brand.name}</span>
              )}
              {product.is_featured && (
                <span className="badge-pink">
                  <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold text-white leading-tight mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'text-warning-400 fill-current' : 'text-zinc-700'}`} />
                ))}
              </div>
              <span className="text-sm text-zinc-500">4.0 (128 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4 mb-8">
                <span className="text-3xl font-display font-bold text-white">₹{parseFloat(displayPrice).toFixed(2)}</span>
              {hasDiscount && <span className="text-lg text-zinc-500 line-through">₹{parseFloat(product.price).toFixed(2)}</span>}
            </div>

            {/* SKU & Stock */}
            <div className="flex items-center gap-4 mb-6 text-sm">
              {product.sku && <span className="text-zinc-500">SKU: <span className="text-zinc-300">{product.sku}</span></span>}
              {product.stock_quantity > 0 ? (
                <span className="text-success-400">● In Stock ({product.stock_quantity})</span>
              ) : (
                <span className="text-error-400">● Out of Stock</span>
              )}
            </div>

            <div className="border-t border-white/[0.06] pt-6 mb-6">
              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm text-zinc-400">Quantity:</span>
                <div className="flex items-center gap-1 bg-zinc-900 rounded-xl border border-white/[0.08] p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors font-bold">
                    −
                  </button>
                  <span className="w-8 text-center text-sm text-white font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                    className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors font-bold">
                    +
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={addingCart || product.stock_quantity === 0}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white btn-primary disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingCart ? 'Adding...' : 'Add to Cart'}
                </motion.button>

                <motion.button
                  onClick={handleBuyNow}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm btn-accent"
                >
                  <Zap className="w-5 h-5" />
                  Buy Now
                </motion.button>

                <motion.button
                  onClick={() => toggleWishlist(product.id)}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 rounded-xl border flex items-center justify-center transition-all ${
                    inWishlist ? 'bg-pink-500/15 border-pink-500/40 text-pink-400' : 'border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:border-pink-500/40 hover:text-pink-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
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
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04] text-center">
                  <Icon className="w-5 h-5 text-violet-400" />
                  <span className="text-xs text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-16 border-t border-white/[0.06] pt-12">
            <h2 className="font-display text-2xl font-bold text-white mb-6">Product Description</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>

            {product.weight && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Weight', value: `${product.weight}kg` },
                  { label: 'SKU', value: product.sku },
                  { label: 'Category', value: product.category?.name },
                  { label: 'Brand', value: product.brand?.name },
                ].filter(d => d.value).map(({ label, value }) => (
                  <div key={label} className="dark-card p-4">
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className="text-sm text-white font-medium">{value}</p>
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
