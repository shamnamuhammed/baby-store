
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';

import api from '../utils/axios';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import PageTransition from '../components/PageTransition';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import { useWishlist } from '../hooks/useWishlist';

/**
 * Parse the verified backend response:
 * {
 *   success: true,
 *   data: {
 *     count: 16,
 *     total_pages: 2,
 *     current_page: 1,
 *     page_size: 10,
 *     results: [...]
 *   }
 * }
 */
function getPaginatedData(responseData) {
  const payload = responseData?.data ?? responseData;

  if (Array.isArray(payload)) {
    return {
      products: payload,
      totalPages: 1,
    };
  }

  const products = Array.isArray(payload?.results)
    ? payload.results
    : [];

  const pageSize = Number(payload?.page_size) || 10;

  const calculatedPages =
    payload?.count != null
      ? Math.ceil(Number(payload.count) / pageSize)
      : 1;

  const parsedTotalPages = Number(
    payload?.total_pages ??
      payload?.totalPages ??
      calculatedPages
  );

  return {
    products,
    totalPages: Math.max(
      1,
      Number.isFinite(parsedTotalPages)
        ? parsedTotalPages
        : 1
    ),
  };
}

/**
 * Extract category and brand arrays.
 */
function getListData(responseData) {
  const payload = responseData?.data ?? responseData;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

/**
 * Build backend query parameters.
 */
function buildProductParams({
  currentPage,
  search,
  categoryId,
  brandId,
  featured,
  sort,
}) {
  const params = new URLSearchParams();

  params.set('page', String(currentPage));

  if (search) {
    params.set('search', search);
  }

  if (categoryId) {
    params.set('category', categoryId);
  }

  if (brandId) {
    params.set('brand', brandId);
  }

  if (featured === 'true') {
    params.set('is_featured', 'true');
  }

  if (sort === 'newest') {
    params.set('ordering', '-created_at');
  } else if (sort === 'price_asc') {
    params.set('ordering', 'price');
  } else if (sort === 'price_desc') {
    params.set('ordering', '-price');
  }

  return params;
}

function getApiErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.error ||
    'Unable to load products. Please try again.'
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // URL is the single source of truth for listing state.
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const brandId = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || '';
  const featured = searchParams.get('featured') || '';

  const pageFromUrl = Number(searchParams.get('page'));

  const currentPage =
    Number.isInteger(pageFromUrl) && pageFromUrl > 0
      ? pageFromUrl
      : 1;

  const [totalPages, setTotalPages] = useState(1);

  // Keep the input editable while syncing it with browser navigation.
  const [searchInput, setSearchInput] = useState(search);

  const { wishlistIds, fetchWishlist, toggleWishlist } =
    useWishlist();

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  /**
   * Load products.
   *
   * Important:
   * - Remove the old results immediately.
   * - Cancel the previous request when the query changes.
   * - Only allow the active request to update the page.
   */
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      // Prevent products from a previous query remaining visible.
      setProducts([]);
      setTotalPages(1);

      try {
        const params = buildProductParams({
          currentPage,
          search,
          categoryId,
          brandId,
          featured,
          sort,
        });

        const response = await api.get(
          `/api/products/?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!active) {
          return;
        }

        const result = getPaginatedData(response.data);

        setProducts(result.products);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (
          !active ||
          controller.signal.aborted ||
          err?.code === 'ERR_CANCELED'
        ) {
          return;
        }

        setProducts([]);
        setTotalPages(1);
        setError(getApiErrorMessage(err));
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    currentPage,
    search,
    categoryId,
    brandId,
    featured,
    sort,
    retryKey,
  ]);

  /**
   * Load category and brand options once.
   */
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadFilters() {
      try {
        const [categoryResponse, brandResponse] =
          await Promise.all([
            api.get('/api/products/categories/', {
              signal: controller.signal,
            }),
            api.get('/api/products/brands/', {
              signal: controller.signal,
            }),
          ]);

        if (!active) {
          return;
        }

        setCategories(getListData(categoryResponse.data));
        setBrands(getListData(brandResponse.data));
      } catch (err) {
        if (
          !active ||
          controller.signal.aborted ||
          err?.code === 'ERR_CANCELED'
        ) {
          return;
        }

        setCategories([]);
        setBrands([]);
      } finally {
        if (active && !controller.signal.aborted) {
          setFiltersLoading(false);
        }
      }
    }

    void loadFilters();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  /**
   * Load wishlist data.
   */
  useEffect(() => {
    void fetchWishlist();
  }, [fetchWishlist]);

  /**
   * Update a URL parameter and reset pagination.
   */
  const updateParam = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);

      if (value) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }

      // A changed query must start from the first page.
      params.delete('page');

      setSearchParams(params);
      setSidebarOpen(false);
    },
    [searchParams, setSearchParams]
  );

  /**
   * Submit search.
   */

const handleSearch = (event) => {
  event.preventDefault();

  const params = new URLSearchParams(searchParams);
  const query = searchInput.trim();

  // A new search starts without the previous filters.
  params.delete('category');
  params.delete('brand');
  params.delete('featured');
  params.delete('is_featured');
  params.delete('page');

  if (query) {
    params.set('search', query);
  } else {
    params.delete('search');
  }

  setSearchParams(params);
};


  /**
   * Clear all listing filters.
   */
  const clearAll = () => {
    setSearchInput('');
    setSearchParams({});
    setSidebarOpen(false);
  };

  /**
   * Retry failed product requests.
   */
  const handleRetry = () => {
    setRetryKey((key) => key + 1);
  };

  const hasFilters = Boolean(
    search || categoryId || brandId || sort || featured
  );

  const sortOptions = [
    { value: '', label: 'Default' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  /**
   * Change page through the URL.
   * No separate current-page state is needed.
   */
  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === currentPage ||
      loading
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams);

    if (nextPage === 1) {
      params.delete('page');
    } else {
      params.set('page', String(nextPage));
    }

    setSearchParams(params);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <PageTransition>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              {search
                ? `Results for "${search}"`
                : 'All Products'}
            </h1>

            <p className="text-zinc-400 text-sm mt-1">
              {loading
                ? 'Loading products...'
                : error
                  ? 'Products could not be loaded'
                  : `${products.length} products found on this page`}
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>

        {/* Search and sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
          <form
            onSubmit={handleSearch}
            className="flex-1 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />

            <input
              type="search"
              name="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
            />
          </form>

          <div className="relative">
            <select
              value={sort}
              onChange={(event) =>
                updateParam('sort', event.target.value)
              }
              aria-label="Sort products"
              className="w-full appearance-none pl-4 pr-10 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen((open) => !open)
            }
            aria-expanded={sidebarOpen}
            aria-controls="product-filter-sidebar"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-zinc-300 hover:text-white lg:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside
            id="product-filter-sidebar"
            className={`${
              sidebarOpen ? 'block' : 'hidden'
            } lg:block w-full lg:w-56 flex-shrink-0`}
          >
            <div className="dark-card p-5 lg:sticky lg:top-24 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Category
                </h3>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateParam('category', '')
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !categoryId
                        ? 'bg-violet-500/15 text-violet-400'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    All Categories
                  </button>

                  {filtersLoading ? (
                    <p className="px-3 py-2 text-xs text-zinc-500">
                      Loading categories...
                    </p>
                  ) : (
                    categories.map((category) => (
                      <button
                        type="button"
                        key={category.id}
                        onClick={() =>
                          updateParam(
                            'category',
                            category.id
                          )
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          categoryId === String(category.id)
                            ? 'bg-violet-500/15 text-violet-400'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Brands */}
              {!filtersLoading && brands.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Brand
                  </h3>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateParam('brand', '')
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        !brandId
                          ? 'bg-violet-500/15 text-violet-400'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      All Brands
                    </button>

                    {brands.map((brand) => (
                      <button
                        type="button"
                        key={brand.id}
                        onClick={() =>
                          updateParam('brand', brand.id)
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          brandId === String(brand.id)
                            ? 'bg-violet-500/15 text-violet-400'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured products */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Filter
                </h3>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured === 'true'}
                    onChange={(event) =>
                      updateParam(
                        'featured',
                        event.target.checked ? 'true' : ''
                      )
                    }
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-violet-500 focus:ring-violet-500/40"
                  />

                  <span className="text-sm text-zinc-400">
                    Featured only
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product results */}
          <section
            className="flex-1 min-w-0"
            aria-label="Product results"
            aria-busy={loading}
          >
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }, (_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : error ? (
              <div
                role="alert"
                className="dark-card rounded-2xl p-8 text-center"
              >
                <p className="text-red-400 mb-4">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                type="search"
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
                action={
                  <button
                    type="button"
                    onClick={clearAll}
                    className="btn-primary px-6 py-2.5 text-sm"
                  >
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
                      isWishlisted={wishlistIds.has(
                        product.id
                      )}
                      onWishlistToggle={toggleWishlist}
                    />
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap justify-center items-center gap-4 mt-10">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || loading}
                      onClick={() =>
                        handlePageChange(currentPage - 1)
                      }
                      className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <span className="text-white text-sm">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        currentPage >= totalPages || loading
                      }
                      onClick={() =>
                        handlePageChange(currentPage + 1)
                      }
                      className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </PageTransition>
  );
}
