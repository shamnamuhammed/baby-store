import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronDown, LayoutGrid, List } from 'lucide-react';
import api from '../utils/axios';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import PageTransition from '../components/PageTransition';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import { useWishlist } from '../hooks/useWishlist';
import { Link } from 'react-router-dom';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const { wishlistIds, fetchWishlist, toggleWishlist } = useWishlist();

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const brandId = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || '';
  const featured = searchParams.get('featured') || '';

  const [localSearch, setLocalSearch] = useState(search);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage);
      if (search) params.set('search', search);
      if (categoryId) params.set('category', categoryId);
      if (brandId) params.set('brand', brandId);
      if (featured) params.set('is_featured', 'true');
      if (sort === 'newest') params.set('ordering', '-created_at');
      else if (sort === 'price_asc') params.set('ordering', 'price');
      else if (sort === 'price_desc') params.set('ordering', '-price');
      console.log(params.toString());
      const res = await api.get(`/api/products/?${params}`);
     console.log(JSON.stringify(res.data, null, 2));
      console.log("full response :",res.data);
      console.log("Results:",res.data.results);
      console.log("Data:", res.data.data)
      setProducts(res.data.data.results);

      setTotalPages(
        (res.data.data.total_pages)
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, brandId, featured, sort, currentPage]);

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
  }, [fetchProducts, fetchWishlist]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/api/products/categories/'),
          api.get('/api/products/brands/'),
        ]);
        const catData = catRes.data?.data || catRes.data;
        const brandData = brandRes.data?.data || brandRes.data;
        setCategories(Array.isArray(catData) ? catData : catData?.results || []);
        setBrands(Array.isArray(brandData) ? brandData : brandData?.results || []);
      } catch {}
    };
    loadFilters();
  }, []);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('search', localSearch.trim());
  };

  const clearAll = () => {
    setSearchParams({});
    setLocalSearch('');
  };

  const hasFilters = search || categoryId || brandId || sort || featured;

  const sortOptions = [
    { value: '', label: 'Default' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              {search ? `Results for "${search}"` : 'All Products'}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {loading ? 'Loading...' : `${products.length} products found`}
            </p>
          </div>
          {hasFilters && (
            <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
              <X className="w-4 h-4" /> Clear filters
            </button>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
            />
          </form>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>

          {/* Filter Toggle Mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-zinc-300 hover:text-white lg:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-56 flex-shrink-0`}>
            <div className="dark-card p-5 sticky top-24 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Category</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => updateParam('category', '')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoryId ? 'bg-violet-500/15 text-violet-400' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateParam('category', c.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${categoryId == c.id ? 'bg-violet-500/15 text-violet-400' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Brand</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => updateParam('brand', '')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!brandId ? 'bg-violet-500/15 text-violet-400' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}
                    >
                      All Brands
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => updateParam('brand', b.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${brandId == b.id ? 'bg-violet-500/15 text-violet-400' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Filter</h3>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured === 'true'}
                    onChange={(e) => updateParam('featured', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-violet-500 focus:ring-violet-500/40"
                  />
                  <span className="text-sm text-zinc-400">Featured only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                type="search"
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
                action={
                  <button onClick={clearAll} className="btn-primary px-6 py-2.5 text-sm">
                    Clear all filters
                  </button>
                }
              />
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlistIds.has(product.id)}
                      onWishlistToggle={toggleWishlist}
                    />
                  ))}
                </motion.div>

                <div className="flex justify-center items-center gap-4 mt-10">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="btn-primary disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span className="text-white">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="btn-primary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </PageTransition>
  );
}