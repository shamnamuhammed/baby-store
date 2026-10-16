
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Layers3,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  AlertCircle,
  Tag,
  FileText,
} from 'lucide-react';

import api from '../../utils/axios';

const ENDPOINT = '/api/admin/products/categories/';

const EMPTY_FORM = {
  name: '',
  description: '',
  is_active: true,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function unwrapResponse(response) {
  const body = response?.data;

  if (body?.data !== undefined) {
    return body.data;
  }

  return body;
}

function getCategoryList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.categories)) return payload.categories;

  return [];
}

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
            .map((item) =>
              typeof item === 'string'
                ? item
                : JSON.stringify(item),
            )
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

  switch (error?.response?.status) {
    case 400:
      return 'The submitted information is invalid. Check the fields and try again.';
    case 401:
      return 'Your session may have expired. Please sign in again.';
    case 403:
      return 'You do not have permission to manage categories.';
    case 404:
      return 'The category endpoint was not found. Check your Django URL configuration.';
    case 409:
      return 'This operation conflicts with the current category state.';
    default:
      return error?.message || 'Something went wrong. Please try again.';
  }
}

function getCategoryActive(category) {
  return category?.is_active ?? category?.isActive ?? true;
}

function getInitialForm(category) {
  if (!category) {
    return { ...EMPTY_FORM };
  }

  return {
    name: category.name || '',
    description: category.description || '',
    is_active: getCategoryActive(category),
  };
}

/* -------------------------------------------------------------------------- */
/* Summary card                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({ label, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-violet-500/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        active
          ? 'bg-emerald-500/10 text-emerald-300'
          : 'bg-slate-500/15 text-slate-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-400' : 'bg-slate-500'
        }`}
      />

      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Category icon                                                              */
/* -------------------------------------------------------------------------- */

function CategoryIcon({ name }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/10 text-lg font-semibold text-violet-300">
      {initial}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({ hasCategories, onCreate }) {
  return (
    <div className="px-5 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
        <Layers3 size={25} />
      </div>

      <h3 className="mt-4 font-semibold text-white">
        {hasCategories ? 'No matching categories' : 'No categories yet'}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
        {hasCategories
          ? 'Try a different search term or change the status filter.'
          : 'Create your first category to organize your baby store products.'}
      </p>

      {!hasCategories && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Plus size={16} />
          Create category
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Notification                                                               */
/* -------------------------------------------------------------------------- */

function Notification({ type = 'success', message, onClose }) {
  const success = type === 'success';

  return (
    <div
      role={success ? 'status' : 'alert'}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
        success
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
          : 'border-red-500/20 bg-red-500/10 text-red-300'
      }`}
    >
      {success ? (
        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={19} className="mt-0.5 shrink-0" />
      )}

      <p className="flex-1 leading-6">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1 opacity-80 transition hover:bg-white/10 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Create/edit category modal                                                 */
/* -------------------------------------------------------------------------- */

function CategoryModal({ category, saving, onClose, onSubmit }) {
  // Initialize the form when the modal mounts.
  // The parent unmounts the modal when it closes.
  const [form, setForm] = useState(() => getInitialForm(category));
  const [formError, setFormError] = useState('');

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saving, onClose]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (formError) {
      setFormError('');
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    setFormError('');

    const name = form.name.trim();

    if (!name) {
      setFormError('Category name is required.');
      return;
    }

    try {
      await onSubmit({
        name,
        description: form.description.trim(),
        is_active: form.is_active,
      });
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-violet-300">
              <Layers3 size={15} />
              Catalog management
            </div>

            <h2
              id="category-modal-title"
              className="text-xl font-semibold text-white"
            >
              {category ? 'Edit category' : 'Create category'}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {category
                ? 'Update the details for this category.'
                : 'Add a category to organize your products.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5 p-5">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Category name <span className="text-red-400">*</span>
            </label>

            <input
              id="category-name"
              name="name"
              type="text"
              value={form.name}
              onChange={updateField}
              required
              maxLength={150}
              autoFocus
              placeholder="e.g. Baby Clothing"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="category-description"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Description
            </label>

            <textarea
              id="category-description"
              name="description"
              value={form.description}
              onChange={updateField}
              rows={4}
              placeholder="Describe the products in this category..."
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/50 p-4">
            <div>
              <p className="text-sm font-medium text-white">
                Active category
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Keep this category enabled in your catalog.
              </p>
            </div>

            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={updateField}
              className="h-4 w-4 shrink-0 accent-violet-500"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <LoaderCircle size={16} className="animate-spin" />
              )}

              {saving
                ? 'Saving...'
                : category
                  ? 'Save changes'
                  : 'Create category'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main admin categories page                                                 */
/* -------------------------------------------------------------------------- */

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(ENDPOINT);
      const payload = unwrapResponse(response);

      setCategories(getCategoryList(payload));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  // Start the initial request after the page mounts.
  // The effect invokes the async function through a microtask so the
  // request and its state updates do not execute synchronously in the effect.
  useEffect(() => {
    const request = Promise.resolve().then(() => loadCategories());

    return () => {
      // No state updates are performed by the cleanup.
      // The request itself is allowed to finish.
      void request;
    };
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !query ||
        String(category.name || '').toLowerCase().includes(query) ||
        String(category.slug || '').toLowerCase().includes(query) ||
        String(category.description || '').toLowerCase().includes(query);

      const active = getCategoryActive(category);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && active === true) ||
        (statusFilter === 'inactive' && active === false);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = categories.filter(
    (category) => getCategoryActive(category) === true,
  ).length;

  const inactiveCount = categories.length - activeCount;

  const openCreateModal = useCallback(() => {
    setEditingCategory(null);
    setError('');
    setNotice('');
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((category) => {
    setEditingCategory(category);
    setError('');
    setNotice('');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (saving) return;

    setModalOpen(false);
    setEditingCategory(null);
  }, [saving]);

  async function handleSubmit(payload) {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingCategory) {
        await api.patch(
          `${ENDPOINT}${editingCategory.id}/`,
          payload,
        );
      } else {
        await api.post(ENDPOINT, payload);
      }

      setModalOpen(false);
      setEditingCategory(null);

      setNotice(
        editingCategory
          ? 'Category updated successfully.'
          : 'Category created successfully.',
      );

      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Delete category "${category.name}"?\n\nThis action may be blocked if products are assigned to this category.`,
    );

    if (!confirmed) return;

    setDeletingId(category.id);
    setError('');
    setNotice('');

    try {
      await api.delete(`${ENDPOINT}${category.id}/`);

      setNotice(
        `Category "${category.name}" deleted successfully.`,
      );

      await loadCategories();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-full space-y-6 text-slate-100">
      {/* Page heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-violet-300">
            <Layers3 size={16} />
            <span>Catalog management</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Categories
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Organize your LilBunny baby store products into manageable
            categories.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:bg-violet-500"
        >
          <Plus size={18} />
          Add category
        </button>
      </header>

      {/* Feedback messages */}
      {notice && (
        <Notification
          type="success"
          message={notice}
          onClose={() => setNotice('')}
        />
      )}

      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total categories"
          value={categories.length}
          icon={Layers3}
          description="Categories loaded from your catalog"
        />

        <SummaryCard
          label="Active categories"
          value={activeCount}
          icon={CheckCircle2}
          description="Enabled categories"
        />

        <SummaryCard
          label="Inactive categories"
          value={inactiveCount}
          icon={XCircle}
          description="Disabled categories"
        />
      </div>

      {/* Main table */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/5">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">All categories</h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredCategories.length} of {categories.length} categories
              shown
            </p>
          </div>

          <button
            type="button"
            onClick={loadCategories}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 gap-3 border-b border-white/10 p-4 md:grid-cols-[minmax(0,1fr)_190px]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, slug or description..."
              aria-label="Search categories"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter categories by status"
            className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 outline-none transition focus:border-violet-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        {/* Table content */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400">
            <LoaderCircle
              size={21}
              className="animate-spin text-violet-400"
            />
            Loading categories...
          </div>
        ) : error && categories.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <AlertCircle size={28} className="mx-auto text-red-300" />

            <h3 className="mt-4 font-semibold text-white">
              Categories could not be loaded
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Check that your backend is running and that the admin
              category endpoint is correct.
            </p>

            <button
              type="button"
              onClick={loadCategories}
              className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Try again
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            hasCategories={categories.length > 0}
            onCreate={openCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Slug</th>
                  <th className="px-5 py-4 font-medium">Description</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {filteredCategories.map((category) => {
                  const active = getCategoryActive(category);
                  const deleting = deletingId === category.id;

                  return (
                    <tr
                      key={category.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <CategoryIcon name={category.name} />

                          <div className="min-w-0">
                            <p className="font-medium text-white">
                              {category.name || 'Unnamed category'}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID: {category.id ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <Tag size={14} className="text-slate-500" />
                          {category.slug || '—'}
                        </span>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-slate-400">
                        <span className="inline-flex items-start gap-2">
                          <FileText
                            size={14}
                            className="mt-0.5 shrink-0 text-slate-500"
                          />

                          <span className="line-clamp-2">
                            {category.description || 'No description'}
                          </span>
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={active} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            disabled={deleting || saving}
                            title="Edit category"
                            aria-label={`Edit ${category.name}`}
                            className="rounded-lg border border-white/10 p-2.5 text-slate-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={deleting || saving}
                            title="Delete category"
                            aria-label={`Delete ${category.name}`}
                            className="rounded-lg border border-white/10 p-2.5 text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deleting ? (
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

      {/* Mount the modal only while open so its form starts fresh each time. */}
      {modalOpen && (
        <CategoryModal
          key={editingCategory?.id ?? 'new-category'}
          category={editingCategory}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
