import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Tag,
  CheckCircle2,
  XCircle,
  LoaderCircle,
} from 'lucide-react';

import api from '../../utils/axios';

const ENDPOINT = '/api/admin/products/brands/';

const EMPTY_FORM = {
  name: '',
  description: '',
  is_active: true,
};

/**
 * Extract the actual response payload.
 * Supports:
 * { data: [...] }
 * { results: [...] }
 * { data: { results: [...] } }
 */
function unwrap(response) {
  const body = response?.data;

  return body?.data !== undefined ? body.data : body;
}

/**
 * Normalize different API list response formats.
 */
function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.brands)) {
    return payload.brands;
  }

  return [];
}

/**
 * Convert API errors into readable messages.
 */
function getErrorMessage(error) {
  const body = error?.response?.data;

  if (typeof body?.message === 'string') {
    return body.message;
  }

  if (typeof body?.detail === 'string') {
    return body.detail;
  }

  if (body && typeof body === 'object') {
    const messages = Object.entries(body)
      .map(([field, value]) => {
        let detail = '';

        if (Array.isArray(value)) {
          detail = value
            .map((item) => {
              if (typeof item === 'string') {
                return item;
              }

              return item?.message || String(item);
            })
            .join(', ');
        } else if (typeof value === 'string') {
          detail = value;
        } else if (value && typeof value === 'object') {
          detail = JSON.stringify(value);
        }

        return detail ? `${field}: ${detail}` : '';
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  if (error?.response?.status === 401) {
    return 'Your session may have expired. Please sign in again.';
  }

  if (error?.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error?.response?.status >= 500) {
    return 'A server error occurred. Please try again later.';
  }

  return error?.message || 'Something went wrong. Please try again.';
}

/**
 * Normalize brand active status.
 * Defaults to active when the API omits the status field.
 */
function isBrandActive(brand) {
  return (brand?.is_active ?? brand?.isActive ?? true) === true;
}

/**
 * Reusable summary card.
 */
function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>

        <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  /**
   * Load brands from the API.
   *
   * This function is used by button handlers and CRUD operations.
   * The initial loading effect uses its own async request so it does
   * not synchronously update state through this function.
   */
  const loadBrands = useCallback(
    async ({ signal, showLoader = true } = {}) => {
      if (showLoader) {
        setLoading(true);
      }

      setError('');

      try {
        const response = await api.get(ENDPOINT, { signal });

        if (signal?.aborted) {
          return;
        }

        const payload = unwrap(response);

        setBrands(normalizeList(payload));
      } catch (err) {
        if (
          err?.code === 'ERR_CANCELED' ||
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError'
        ) {
          return;
        }

        if (!signal?.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  /**
   * Initial load.
   *
   * State is updated after the asynchronous request completes.
   * Cancellation prevents stale updates after unmount.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function fetchBrands() {
      try {
        const response = await api.get(ENDPOINT, {
          signal: controller.signal,
        });

        if (cancelled || controller.signal.aborted) {
          return;
        }

        const payload = unwrap(response);

        setBrands(normalizeList(payload));
        setError('');
      } catch (err) {
        if (
          cancelled ||
          controller.signal.aborted ||
          err?.code === 'ERR_CANCELED' ||
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError'
        ) {
          return;
        }

        setError(getErrorMessage(err));
      } finally {
        if (!cancelled && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchBrands();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  /**
   * Filter brands by search text and status.
   */
  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brands.filter((brand) => {
      const name = String(brand?.name || '').toLowerCase();
      const slug = String(brand?.slug || '').toLowerCase();
      const description = String(
        brand?.description || ''
      ).toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        slug.includes(query) ||
        description.includes(query);

      const active = isBrandActive(brand);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && active) ||
        (statusFilter === 'inactive' && !active);

      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);

  const activeCount = useMemo(
    () => brands.filter(isBrandActive).length,
    [brands]
  );

  const inactiveCount = brands.length - activeCount;

  /**
   * Open the create-brand modal.
   */
  function openCreateModal() {
    setEditingBrand(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setModalOpen(true);
  }

  /**
   * Open the edit-brand modal.
   */
  function openEditModal(brand) {
    setEditingBrand(brand);

    setForm({
      name: brand?.name || '',
      description: brand?.description || '',
      is_active: isBrandActive(brand),
    });

    setFormError('');
    setModalOpen(true);
  }

  /**
   * Close the modal unless a save operation is running.
   */
  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingBrand(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
  }

  /**
   * Update form fields.
   */
  function handleFieldChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setFormError('');
  }

  /**
   * Create or update a brand.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setFormError('');
    setError('');
    setNotice('');

    const name = form.name.trim();

    if (!name) {
      setFormError('Brand name is required.');
      return;
    }

    const payload = {
      name,
      description: form.description.trim(),
      is_active: form.is_active,
    };

    setSaving(true);

    try {
      if (editingBrand) {
        await api.patch(
          `${ENDPOINT}${editingBrand.id}/`,
          payload
        );

        setNotice('Brand updated successfully.');
      } else {
        await api.post(ENDPOINT, payload);

        setNotice('Brand created successfully.');
      }

      setModalOpen(false);
      setEditingBrand(null);
      setForm({ ...EMPTY_FORM });
      setFormError('');

      await loadBrands({ showLoader: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  /**
   * Delete a brand after confirmation.
   */
  async function handleDelete(brand) {
    if (deletingId !== null || saving) {
      return;
    }

    const confirmed = window.confirm(
      `Delete brand "${brand.name}"?\n\nContinue only if you intend to remove this brand.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(brand.id);
    setError('');
    setNotice('');

    try {
      await api.delete(`${ENDPOINT}${brand.id}/`);

      setNotice(
        `Brand "${brand.name}" deleted successfully.`
      );

      // Update the UI immediately after successful deletion.
      setBrands((current) =>
        current.filter((item) => item.id !== brand.id)
      );

      // Refresh to synchronize with the server.
      await loadBrands({ showLoader: false });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  /**
   * Refresh the list.
   */
  function handleRefresh() {
    if (!loading) {
      void loadBrands({ showLoader: true });
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-violet-300">
            <Tag size={16} />
            <span>Catalog management</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Brands
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Manage the brands available in your baby store.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Plus size={18} />
          Add brand
        </button>
      </div>

      {/* Success notification */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice('')}
            className="ml-auto"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* API error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <XCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span className="break-words">{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total brands"
          value={brands.length}
          icon={<Tag size={20} />}
        />

        <SummaryCard
          label="Active brands"
          value={activeCount}
          icon={<CheckCircle2 size={20} />}
        />

        <SummaryCard
          label="Inactive brands"
          value={inactiveCount}
          icon={<XCircle size={20} />}
        />
      </div>

      {/* Brands table */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              All brands
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredBrands.length} brands shown
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {/* Search and status filter */}
        <div className="grid grid-cols-1 gap-3 border-b border-white/10 p-4 md:grid-cols-[1fr_190px]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by brand name, slug or description..."
              aria-label="Search brands"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter brands by status"
            className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 outline-none focus:border-violet-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        {/* Loading state */}
        {loading ? (
          <div
            className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-400"
            role="status"
          >
            <LoaderCircle
              size={20}
              className="animate-spin text-violet-400"
            />
            Loading brands...
          </div>
        ) : error && brands.length === 0 ? (
          /* Failed initial load */
          <div className="p-10 text-center">
            <p className="text-sm text-slate-300">
              Brands could not be loaded.
            </p>

            <button
              type="button"
              onClick={() => void loadBrands()}
              className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Try again
            </button>
          </div>
        ) : filteredBrands.length === 0 ? (
          /* Empty state */
          <div className="px-5 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <Tag size={23} />
            </div>

            <h3 className="font-medium text-white">
              {brands.length === 0
                ? 'No brands yet'
                : 'No matching brands'}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {brands.length === 0
                ? 'Create your first brand to organize your catalog.'
                : 'Try a different search term or status filter.'}
            </p>

            {brands.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Create brand
              </button>
            )}

            {brands.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                Clear search and filters
              </button>
            )}
          </div>
        ) : (
          /* Brands data table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-4 font-medium">
                    Brand
                  </th>

                  <th scope="col" className="px-5 py-4 font-medium">
                    Slug
                  </th>

                  <th scope="col" className="px-5 py-4 font-medium">
                    Description
                  </th>

                  <th scope="col" className="px-5 py-4 font-medium">
                    Status
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-4 text-right font-medium"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {filteredBrands.map((brand) => {
                  const active = isBrandActive(brand);

                  return (
                    <tr
                      key={brand.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      {/* Brand name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 font-semibold text-violet-300">
                            {(brand.name || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-medium text-white">
                              {brand.name || 'Unnamed brand'}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID: {brand.id ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-4 text-slate-400">
                        {brand.slug || '—'}
                      </td>

                      {/* Description */}
                      <td className="max-w-xs px-5 py-4 text-slate-400">
                        <span className="line-clamp-2">
                          {brand.description || 'No description'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            active
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-slate-500/15 text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              active
                                ? 'bg-emerald-400'
                                : 'bg-slate-500'
                            }`}
                          />

                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(brand)}
                            title="Edit brand"
                            aria-label={`Edit ${brand.name || 'brand'}`}
                            className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(brand)}
                            disabled={
                              deletingId !== null || saving
                            }
                            title="Delete brand"
                            aria-label={`Delete ${brand.name || 'brand'}`}
                            className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === brand.id ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create / edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-modal-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
          >
            {/* Modal heading */}
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2
                  id="brand-modal-title"
                  className="text-lg font-semibold text-white"
                >
                  {editingBrand ? 'Edit brand' : 'Create brand'}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {editingBrand
                    ? 'Update the brand details.'
                    : 'Add a new brand to your catalog.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            {/* Modal form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              {formError && (
                <div
                  role="alert"
                  className="break-words rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  {formError}
                </div>
              )}

              {/* Brand name */}
              <div>
                <label
                  htmlFor="brand-name"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Brand name{' '}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  id="brand-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleFieldChange}
                  required
                  maxLength={150}
                  disabled={saving}
                  autoFocus
                  placeholder="e.g. Little Angels"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500 disabled:opacity-60"
                />
              </div>

              {/* Brand description */}
              <div>
                <label
                  htmlFor="brand-description"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Description
                </label>

                <textarea
                  id="brand-description"
                  name="description"
                  value={form.description}
                  onChange={handleFieldChange}
                  rows={4}
                  disabled={saving}
                  placeholder="Describe this brand..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500 disabled:opacity-60"
                />
              </div>

              {/* Active status */}
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Active brand
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Keep this brand enabled in the catalog.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleFieldChange}
                  disabled={saving}
                  className="h-4 w-4 accent-violet-500"
                />
              </label>

              {/* Form actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? 'Saving...'
                    : editingBrand
                      ? 'Save changes'
                      : 'Create brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
