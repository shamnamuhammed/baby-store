import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Star, Package, Shield, Truck } from 'lucide-react';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import PageTransition from '../components/PageTransition';
import { useWishlist } from '../hooks/useWishlist';

const BACKEND_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
function getImageUrl(img) {
  // const url = img?.image || img?.url || img?.src || '';
  if (!img) return null;
  let imageUrl = "";
   if (typeof img === "string") {
    imageUrl = img;
  } else {
    imageUrl = img.image || img.url || img.src || "";
  }

  return imageUrl.startsWith("http")
    ? imageUrl
    : `${BACKEND_BASE}${imageUrl}`;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { wishlistIds, fetchWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlist();
    const loadHomeData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/api/products/?is_featured=true&limit=8'),
          api.get('/api/products/categories/'),
        ]);
        const pData = prodRes.data?.data || prodRes.data;
        const cData = catRes.data?.data || catRes.data;
        setFeaturedProducts(Array.isArray(pData) ? pData : pData?.results || []);
        setCategories(Array.isArray(cData) ? cData : cData?.results || []);
      } catch (e) {
        console.error('Failed to load home data', e);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, [fetchWishlist]);

  return (
    <PageTransition>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-zinc-950">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1519689680058-324335c77eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
              alt="Premium Baby Essentials" 
              className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
            />
            {/* Dark gradient overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/30" />
            
            {/* Purple/Pink Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[128px]" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-8">
                  <Sparkles className="w-4 h-4" /> The New Standard in Baby Care
                </div>
                
                <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white leading-tight mb-8">
                  Premium Essentials for <br />
                  <span className="text-gradient-violet">Your Little Ones</span>
                </h1>
                
                <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed max-w-lg">
                  Curated collections of safe, organic, and beautifully designed baby products, delivered right to your door.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link to="/products" className="btn-primary w-full sm:w-auto px-8 py-4 text-base flex items-center justify-center gap-2 shadow-glow-violet">
                    Shop Collection <ArrowRight className="w-5 h-5" />
                  </Link>
                  {/* <Link to="/products?featured=true" className="btn-ghost w-full sm:w-auto px-8 py-4 text-base">
                    View Lookbook
                  </Link> */}
                </div>
              </motion.div>

              {/* Foreground Image Graphic */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="hidden lg:block relative"
              >
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/10" style={{ paddingBottom: '120%' }}>
                  <img 
                    src="/hero_image.png" 
                    alt="Baby Products Collection" 
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = "https://images.unsplash.com/photo-1522771930-78848d9293e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border border-white/10 rounded-3xl mix-blend-overlay" />
                </div>
                
                {/* Floating decorative elements */}
                <motion.div 
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-8 -right-8 glass-card p-4 rounded-2xl border border-white/10 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-success-400 fill-current" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">4.9/5</p>
                      <p className="text-zinc-400 text-xs">Customer Rating</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features / Trust */}
        <section className="py-12 border-y border-white/[0.04] bg-zinc-950/50 backdrop-blur-xl relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Shield, title: 'Safe & Certified', desc: 'Every product meets strict safety standards' },
                { icon: Package, title: 'Premium Quality', desc: 'Only the best materials for your baby' },
                { icon: Truck, title: 'Fast Delivery', desc: 'Free shipping on orders over ₹50' }
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.04]"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white mb-1">{f.title}</h4>
                    <p className="text-sm text-zinc-400">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="py-24 bg-zinc-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="font-display text-4xl font-bold text-white mb-4">Shop by Category</h2>
                <p className="text-zinc-400 text-lg">Find exactly what you're looking for.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {categories.slice(0, 8).map((category, i) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/products?category=${category.id}`}
                      className="group block relative h-48 md:h-64 rounded-3xl overflow-hidden border border-white/[0.06]"
                    >
                      {/* Image or Gradient Placeholder */}
                      <div className="absolute inset-0 bg-zinc-900 img-zoom-container">
                         {category.image ? (
                           <img src={getImageUrl(category.image)} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         ) : (
                           <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 group-hover:scale-105 transition-transform duration-500" />
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-80" />
                      </div>
                      
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <h3 className="font-display text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-zinc-400 mt-1 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="py-24 bg-[#0B0B0F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-display text-4xl font-bold text-white mb-4">Trending Now</h2>
                <p className="text-zinc-400 text-lg">Our most loved products this week.</p>
              </div>
              <Link to="/products?featured=true" className="hidden sm:flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-80 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.slice(0, 4).map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <ProductCard
                      product={product}
                      isWishlisted={wishlistIds.has(product.id)}
                      onWishlistToggle={toggleWishlist}
                    />
                  </motion.div>
                ))}
              </div>
            )}
            
            <div className="mt-8 text-center sm:hidden">
              <Link to="/products?featured=true" className="btn-ghost inline-flex items-center justify-center w-full py-3 gap-2">
                View all trending <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </PageTransition>
  );
}
