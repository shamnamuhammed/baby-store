
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Star,
  Package,
  Shield,
  Truck,
  Tag,
  Clock,
} from 'lucide-react';

import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import PageTransition from '../components/PageTransition';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';

const BACKEND_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getImageUrl(img) {
  if (!img) return null;

  let imageUrl = '';

  if (typeof img === 'string') {
    imageUrl = img;
  } else {
    imageUrl = img.image || img.url || img.src || '';
  }

  if (!imageUrl) return null;

  return imageUrl.startsWith('http')
    ? imageUrl
    : `${BACKEND_BASE}${imageUrl}`;
}

function getList(responseData) {
  const result = responseData?.data ?? responseData;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.results)) return result.results;

  return [];
}

function getOfferType(offer) {
  return String(
    offer.offer_type ||
      (offer.product
        ? 'PRODUCT'
        : offer.category
          ? 'CATEGORY'
          : '')
  ).toUpperCase();
}

function getOfferDiscount(offer) {
  const value =
    offer.discount_value ??
    offer.discount_percentage ??
    offer.discount_amount ??
    offer.value;

  if (value == null || value === '') {
    return 'SPECIAL OFFER';
  }

  const type = String(offer.discount_type || '').toLowerCase();

  if (
    type.includes('percent') ||
    type === 'percentage' ||
    offer.discount_percentage != null
  ) {
    return `${Number(value)}% OFF`;
  }

  if (
    type.includes('fixed') ||
    type.includes('amount') ||
    type.includes('flat') ||
    offer.discount_amount != null
  ) {
    return `₹${Number(value).toLocaleString('en-IN')} OFF`;
  }

  return 'SPECIAL OFFER';
}

function getOfferLink(offer) {
  const type = getOfferType(offer);

  const productId =
    typeof offer.product === 'object'
      ? offer.product?.id
      : offer.product;

  const categoryId =
    typeof offer.category === 'object'
      ? offer.category?.id
      : offer.category;

  if (type === 'CATEGORY' && categoryId) {
    return `/products?category=${categoryId}`;
  }

  if (type === 'PRODUCT' && productId) {
    return `/products/${productId}`;
  }

  return '/products';
}

export default function Home() {
  const { isAuthenticated } = useAuth();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { wishlistIds, fetchWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }

    const loadHomeData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/api/products/?is_featured=true&limit=8'),
          api.get('/api/products/categories/'),
          api.get('/api/offers/'),
        ]);

        const [productsResult, categoriesResult, offersResult] = results;

        if (productsResult.status === 'fulfilled') {
          setFeaturedProducts(getList(productsResult.value.data));
        } else {
          console.error(
            'Failed to load featured products:',
            productsResult.reason
          );
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategories(getList(categoriesResult.value.data));
        } else {
          console.error(
            'Failed to load categories:',
            categoriesResult.reason
          );
        }

        if (offersResult.status === 'fulfilled') {
          setSpecialOffers(getList(offersResult.value.data));
        } else {
          console.error(
            'Failed to load special offers:',
            offersResult.reason
          );
        }
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [isAuthenticated, fetchWishlist]);

  return (
    <PageTransition>
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-zinc-950 pt-20">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1519689680058-324335c77eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
              alt="Premium Baby Essentials"
              className="h-full w-full object-cover opacity-30 mix-blend-luminosity"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/30" />

            <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-pink-600/10 blur-[128px]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="max-w-2xl"
              >
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400">
                  <Sparkles className="h-4 w-4" />
                  The New Standard in Baby Care
                </div>

                <h1 className="mb-8 font-display text-5xl font-extrabold leading-tight text-white md:text-7xl">
                  Premium Essentials for <br />
                  <span className="text-gradient-violet">
                    Your Little Ones
                  </span>
                </h1>

                <p className="mb-10 max-w-lg text-lg leading-relaxed text-zinc-400 md:text-xl">
                  Curated collections of safe, organic, and beautifully
                  designed baby products, delivered right to your door.
                </p>

                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <Link
                    to="/products"
                    className="btn-primary flex w-full items-center justify-center gap-2 px-8 py-4 text-base shadow-glow-violet sm:w-auto"
                  >
                    Shop Collection
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </motion.div>

              {/* Hero Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: 'easeOut',
                }}
                className="relative hidden lg:block"
              >
                <div
                  className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-violet-500/10"
                  style={{ paddingBottom: '120%' }}
                >
                  <img
                    src="/hero_image.png"
                    alt="Baby Products Collection"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        'https://images.unsplash.com/photo-1522771930-78848d9293e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 rounded-3xl border border-white/10 mix-blend-overlay" />
                </div>

                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="glass-card absolute -right-8 -top-8 rounded-2xl border border-white/10 p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-500/20">
                      <Star className="h-5 w-5 fill-current text-success-400" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white">4.9/5</p>
                      <p className="text-xs text-zinc-400">
                        Customer Rating
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features / Trust */}
        <section className="relative z-10 border-y border-white/[0.04] bg-zinc-950/50 py-12 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: 'Safe & Certified',
                  desc: 'Every product meets strict safety standards',
                },
                {
                  icon: Package,
                  title: 'Premium Quality',
                  desc: 'Only the best materials for your baby',
                },
                {
                  icon: Truck,
                  title: 'Fast Delivery',
                  desc: 'Free shipping on orders over ₹50',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-zinc-900/50 p-6"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                    <feature.icon className="h-6 w-6 text-violet-400" />
                  </div>

                  <div>
                    <h4 className="mb-1 font-display font-semibold text-white">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-zinc-400">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Special Offers Section */}
        {specialOffers.length > 0 && (
          <section className="relative overflow-hidden bg-[#0B0B0F] py-20">
            <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-violet-600/10 blur-[100px]" />
            <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-pink-600/10 blur-[100px]" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300">
                    <Sparkles className="h-4 w-4" />
                    Specially for your little ones
                  </div>

                  <h2 className="mb-3 font-display text-3xl font-bold text-white sm:text-4xl">
                    Special Offers
                  </h2>

                  <p className="max-w-xl text-base text-zinc-400 sm:text-lg">
                    Discover lovely deals on your little one's essentials.
                  </p>
                </div>

                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 font-medium text-violet-400 transition-colors hover:text-violet-300"
                >
                  Shop all products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {specialOffers.slice(0, 6).map((offer, index) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                    }}
                  >
                    <Link
                      to={getOfferLink(offer)}
                      className="group relative flex h-full min-h-56 flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-900/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/30"
                    >
                      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-500/10 blur-2xl transition-colors group-hover:bg-pink-500/15" />

                      <div className="relative z-10 mb-5 flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
                          <Tag className="h-6 w-6 text-violet-300" />
                        </div>

                        <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1.5 text-xs font-bold tracking-wide text-pink-300">
                          {getOfferDiscount(offer)}
                        </span>
                      </div>

                      <div className="relative z-10 flex flex-1 flex-col">
                        <h3 className="mb-2 font-display text-xl font-bold text-white transition-colors group-hover:text-violet-300">
                          {offer.name || 'Special Offer'}
                        </h3>

                        <p className="mb-6 flex-1 text-sm leading-relaxed text-zinc-400">
                          {offer.description ||
                            'Discover this special deal on baby essentials.'}
                        </p>

                        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                          <span className="text-sm font-semibold text-violet-300">
                            Explore offer
                          </span>

                          <ArrowRight className="h-5 w-5 text-violet-400 transition-transform group-hover:translate-x-1" />
                        </div>

                        {offer.end_date && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              Ends{' '}
                              {new Date(offer.end_date).toLocaleDateString(
                                'en-IN',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="bg-zinc-950 py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-16 text-center">
                <h2 className="mb-4 font-display text-4xl font-bold text-white">
                  Shop by Category
                </h2>
                <p className="text-lg text-zinc-400">
                  Find exactly what you are looking for.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {categories.slice(0, 8).map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/products?category=${category.id}`}
                      className="group relative block h-48 overflow-hidden rounded-3xl border border-white/[0.06] md:h-64"
                    >
                      <div className="img-zoom-container absolute inset-0 bg-zinc-900">
                        {category.image ? (
                          <img
                            src={getImageUrl(category.image)}
                            alt={category.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900 transition-transform duration-500 group-hover:scale-105" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-80" />
                      </div>

                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h3 className="font-display text-xl font-bold text-white transition-colors group-hover:text-violet-300">
                          {category.name}
                        </h3>

                        {category.description && (
                          <p className="mt-1 translate-y-2 line-clamp-1 text-sm text-zinc-400 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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
        <section className="bg-[#0B0B0F] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="mb-4 font-display text-4xl font-bold text-white">
                  Trending Now
                </h2>
                <p className="text-lg text-zinc-400">
                  Our most loved products this week.
                </p>
              </div>

              <Link
                to="/products?featured=true"
                className="hidden items-center gap-2 font-medium text-violet-400 transition-colors hover:text-violet-300 sm:flex"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="skeleton h-80 rounded-2xl"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.slice(0, 4).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
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
              <Link
                to="/products?featured=true"
                className="btn-ghost inline-flex w-full items-center justify-center gap-2 py-3"
              >
                View all trending
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </PageTransition>
  );
}
