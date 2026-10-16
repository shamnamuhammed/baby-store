
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ImageOff,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';

import api from '../../utils/axios';

const PRODUCT_URL = '/api/admin/products/';
const CATEGORY_URL = '/api/admin/products/categories/';
const BRAND_URL = '/api/admin/products/brands/';

const EMPTY_FORM = {
  name: '',
  sku: '',
  description: '',
  category: '',
  brand: '',
  price: '',
  discount_price: '',
  stock_quantity: '0',
  weight: '',
  is_active: true,
  is_featured: false,
};

function getPayload(response) {
  const body = response?.data;

  if (body?.data !== undefined) return body.data;

  return body;
}

function getRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;

  if (Array.isArray(payload?.results?.results)) {
    return payload.results.results;
  }

  return [];
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (data?.errors && typeof data.errors === 'object') {
    return Object.entries(data.errors)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(', ')
          : String(messages);

        return `${field}: ${message}`;
      })
      .join('\n');
  }

  if (data?.message) return data.message;
  if (data?.detail) return data.detail;

  return error?.message || 'Something went wrong. Please try again.';
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getPageInfo(payload) {
  return {
    count: Number(payload?.count ?? getRows(payload).length),
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
  };
}

/**
 * ProductThumbnail
 *
 * Track the URL of a failed image rather than resetting state
 * in an effect. When the image URL changes, the new URL can load.
 */
function ProductThumbnail({ product }) {
  const images = Array.isArray(product?.images) ? product.images : [];

  const image =
    images.find((item) => item?.is_primary) || images[0];

  const imagePath = image?.image_url || image?.image || null;

  const imageUrl = imagePath
    ? new URL(
        imagePath,
        api.defaults.baseURL || window.location.origin
      ).href
    : null;

  const [failedImageUrl, setFailedImageUrl] = useState(null);

  const imageFailed = Boolean(
    imageUrl && failedImageUrl === imageUrl
  );

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={image?.alt_text || product?.name || 'Product'}
          loading="lazy"
          onError={() => setFailedImageUrl(imageUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-zinc-500"
          title="No product image available"
        >
          {imageFailed ? (
            <ImageOff size={20} />
          ) : (
            <Package size={20} />
          )}
        </div>
      )}
    </div>
  );
}

function ProductModal({
  product,
  categories,
  brands,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(() => {
    if (!product) return { ...EMPTY_FORM };

    return {
      name: product.name ?? '',
      sku: product.sku ?? '',
      description: product.description ?? '',
      category:
        product.category == null ? '' : String(product.category),
      brand: product.brand == null ? '' : String(product.brand),
      price: product.price == null ? '' : String(product.price),
      discount_price:
        product.discount_price == null
          ? ''
          : String(product.discount_price),
      stock_quantity: String(product.stock_quantity ?? 0),
      weight: product.weight == null ? '' : String(product.weight),
      is_active: Boolean(product.is_active),
      is_featured: Boolean(product.is_featured),
    };
  });

  const [validationError, setValidationError] = useState('');

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setValidationError('');

    if (!form.name.trim()) {
      setValidationError('Product name is required.');
      return;
    }

    if (!form.sku.trim()) {
      setValidationError('SKU is required.');
      return;
    }

    if (!form.category || !form.brand) {
      setValidationError('Please select a category and brand.');
      return;
    }

    if (
      form.price === '' ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setValidationError('Enter a valid product price.');
      return;
    }

    if (
      form.discount_price !== '' &&
      (!Number.isFinite(Number(form.discount_price)) ||
        Number(form.discount_price) < 0)
    ) {
      setValidationError('Enter a valid discount price.');
      return;
    }

    if (
      form.discount_price !== '' &&
      Number(form.discount_price) > Number(form.price)
    ) {
      setValidationError(
        'Discount price should not be greater than the regular price.'
      );
      return;
    }

    if (
      form.stock_quantity === '' ||
      !Number.isInteger(Number(form.stock_quantity)) ||
      Number(form.stock_quantity) < 0
    ) {
      setValidationError(
        'Stock quantity must be a non-negative whole number.'
      );
      return;
    }

    if (
      form.weight !== '' &&
      (!Number.isFinite(Number(form.weight)) ||
        Number(form.weight) < 0)
    ) {
      setValidationError('Enter a valid non-negative weight.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      category: Number(form.category),
      brand: Number(form.brand),
      price: Number(form.price),
      discount_price:
        form.discount_price === ''
          ? null
          : Number(form.discount_price),
      stock_quantity: Number(form.stock_quantity),
      is_active: form.is_active,
      is_featured: form.is_featured,
    };

    if (form.weight !== '') {
      payload.weight = Number(form.weight);
    }

    await onSave(payload);
  }

  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-white/10 bg-[#17171c] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10';

  const labelClass = 'text-sm font-medium text-zinc-300';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111114] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111114] px-5 py-4 sm:px-7">
          <div>
            <h2
              id="product-modal-title"
              className="text-xl font-bold text-white"
            >
              {product ? 'Edit product' : 'Add new product'}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Enter the product details for your BabyBliss store.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close product form"
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6 p-5 sm:p-7">
          {validationError && (
            <div
              role="alert"
              className="whitespace-pre-line rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
            >
              {validationError}
            </div>
          )}

          <section>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
              Basic information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Product name *
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  className={fieldClass}
                  placeholder="Baby cotton romper"
                  required
                />
              </label>

              <label className={labelClass}>
                SKU *
                <input
                  name="sku"
                  value={form.sku}
                  onChange={updateField}
                  className={fieldClass}
                  placeholder="BABY-ROMPER-001"
                  required
                />
              </label>

              <label className={labelClass}>
                Category *
                <select
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  className={fieldClass}
                  required
                >
                  <option value="">Select category</option>

                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Brand *
                <select
                  name="brand"
                  value={form.brand}
                  onChange={updateField}
                  className={fieldClass}
                  required
                >
                  <option value="">Select brand</option>

                  {brands.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={3}
                  className={`${fieldClass} resize-y`}
                  placeholder="Describe the product, its features and materials."
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
              Pricing and inventory
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Regular price (₹) *
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={updateField}
                  min="0"
                  step="0.01"
                  className={fieldClass}
                  placeholder="999.00"
                  required
                />
              </label>

              <label className={labelClass}>
                Discount price (₹)
                <input
                  type="number"
                  name="discount_price"
                  value={form.discount_price}
                  onChange={updateField}
                  min="0"
                  step="0.01"
                  className={fieldClass}
                  placeholder="Optional"
                />
              </label>

              <label className={labelClass}>
                Stock quantity *
                <input
                  type="number"
                  name="stock_quantity"
                  value={form.stock_quantity}
                  onChange={updateField}
                  min="0"
                  step="1"
                  className={fieldClass}
                  required
                />
              </label>

              <label className={labelClass}>
                Weight
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={updateField}
                  min="0"
                  step="0.001"
                  className={fieldClass}
                  placeholder="Use your backend's weight unit"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={updateField}
                className="mt-1 accent-violet-500"
              />

              <span>
                <span className="block text-sm font-semibold text-white">
                  Active product
                </span>

                <span className="mt-1 block text-xs leading-5 text-zinc-500">
                  Allow customers to see and purchase this product.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={updateField}
                className="mt-1 accent-violet-500"
              />

              <span>
                <span className="block text-sm font-semibold text-white">
                  Featured product
                </span>

                <span className="mt-1 block text-xs leading-5 text-zinc-500">
                  Mark this product as featured in the store.
                </span>
              </span>
            </label>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Check size={17} />
              )}

              {saving
                ? 'Saving...'
                : product
                  ? 'Save changes'
                  : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [pageInfo, setPageInfo] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalProduct, setModalProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /**
   * Load products when the page or refresh key changes.
   *
   * State updates happen after the asynchronous request settles,
   * rather than by calling a state-updating loader directly from
   * the effect body.
   */
  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const response = await api.get(PRODUCT_URL, {
          params: { page },
        });

        if (cancelled) return;

        const payload = getPayload(response);

        setProducts(getRows(payload));
        setPageInfo(getPageInfo(payload));
        setError('');
      } catch (err) {
        if (cancelled) return;

        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  /**
   * Load category and brand options independently of product
   * pagination. Cleanup prevents updates after unmount.
   */
  useEffect(() => {
    let cancelled = false;

    async function fetchOptions() {
      try {
        const [categoryResponse, brandResponse] = await Promise.all([
          api.get(CATEGORY_URL),
          api.get(BRAND_URL),
        ]);

        if (cancelled) return;

        setCategories(getRows(getPayload(categoryResponse)));
        setBrands(getRows(getPayload(brandResponse)));
      } catch (err) {
        if (!cancelled) {
          toast.error(
            `Could not load categories or brands: ${getErrorMessage(err)}`
          );
        }
      }
    }

    void fetchOptions();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.sku,
          product.category_name,
          product.brand_name,
        ].some((value) =>
          String(value ?? '').toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  function refreshProducts() {
    setLoading(true);
    setRefreshKey((current) => current + 1);
  }

  async function handleSave(payload) {
    setSaving(true);

    try {
      if (modalProduct) {
        await api.patch(
          `${PRODUCT_URL}${modalProduct.id}/`,
          payload
        );

        toast.success('Product updated successfully.');
      } else {
        await api.post(PRODUCT_URL, payload);

        toast.success('Product created successfully.');
      }

      setModalOpen(false);
      setModalProduct(null);

      refreshProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(product.id);

    try {
      await api.delete(`${PRODUCT_URL}${product.id}/`);

      toast.success('Product deleted successfully.');

      refreshProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  function openCreateModal() {
    setModalProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product) {
    setModalProduct(product);
    setModalOpen(true);
  }

  function goToPreviousPage() {
    if (page <= 1 || loading) return;

    setLoading(true);
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    if (!pageInfo.next || loading) return;

    setLoading(true);
    setPage((current) => current + 1);
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 text-white">
      <div>
        <Link
          to="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Store management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Products
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Manage your BabyBliss products, pricing and inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            <Plus size={18} />
            Add product
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Products on page
            </span>

            <Package size={19} className="text-violet-300" />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Active on page
            </span>

            <Check size={19} className="text-emerald-300" />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {products.filter((product) => product.is_active).length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Total products
            </span>

            <Boxes size={19} className="text-sky-300" />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {pageInfo.count}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, SKU, category or brand..."
              className="w-full rounded-xl border border-white/10 bg-[#17171c] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#17171c] px-4 py-3 text-sm text-zinc-200 outline-none focus:border-violet-400"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <button
              type="button"
              onClick={refreshProducts}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="whitespace-pre-line text-sm text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={refreshProducts}
              disabled={loading}
              className="shrink-0 rounded-lg border border-red-300/20 px-3 py-2 text-sm text-red-200 hover:bg-red-300/10 disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-4 font-semibold">Product</th>
                <th className="px-3 py-4 font-semibold">
                  Category / brand
                </th>
                <th className="px-3 py-4 font-semibold">Price</th>
                <th className="px-3 py-4 font-semibold">Stock</th>
                <th className="px-3 py-4 font-semibold">Status</th>
                <th className="px-3 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <LoaderCircle
                      size={28}
                      className="mx-auto animate-spin text-violet-300"
                    />

                    <p className="mt-3 text-sm text-zinc-400">
                      Loading products...
                    </p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Package
                      size={30}
                      className="mx-auto text-zinc-600"
                    />

                    <p className="mt-3 font-medium text-zinc-300">
                      No products found
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      Try another search or add a new product.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-start gap-3">
                        <ProductThumbnail product={product} />

                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-sm font-semibold text-white">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            SKU: {product.sku || '—'}
                          </p>

                          {product.is_featured && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-300">
                              <Star size={12} />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <p className="text-sm text-zinc-300">
                        {product.category_name || '—'}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {product.brand_name || '—'}
                      </p>
                    </td>

                    <td className="px-3 py-4">
                      {product.discount_price != null &&
                      product.discount_price !== '' ? (
                        <>
                          <p className="text-sm font-semibold text-emerald-300">
                            {formatPrice(product.discount_price)}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500 line-through">
                            {formatPrice(product.price)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-zinc-200">
                          {formatPrice(product.price)}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={
                          Number(product.stock_quantity) <= 5
                            ? 'text-sm font-semibold text-red-300'
                            : 'text-sm font-medium text-zinc-300'
                        }
                      >
                        {product.stock_quantity ?? 0} units
                      </span>

                      {Number(product.stock_quantity) <= 5 && (
                        <p className="mt-1 text-xs text-red-400">
                          {Number(product.stock_quantity) === 0
                            ? 'Out of stock'
                            : 'Low stock'}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={
                          product.is_active
                            ? 'inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300'
                            : 'inline-flex rounded-full border border-zinc-400/20 bg-zinc-400/10 px-2.5 py-1 text-xs font-medium text-zinc-400'
                        }
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                          className="rounded-lg border border-white/10 p-2.5 text-zinc-300 transition hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-violet-200"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                          title="Delete product"
                          aria-label={`Delete ${product.name}`}
                          className="rounded-lg border border-white/10 p-2.5 text-zinc-300 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingId === product.id ? (
                            <LoaderCircle
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            {search || statusFilter !== 'all'
              ? `${filteredProducts.length} matching products on this page`
              : `${pageInfo.count} total products`}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-zinc-400">
              Page {page}
            </span>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={!pageInfo.next || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          product={modalProduct}
          categories={categories}
          brands={brands}
          saving={saving}
          onClose={() => {
            if (!saving) {
              setModalOpen(false);
              setModalProduct(null);
            }
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
