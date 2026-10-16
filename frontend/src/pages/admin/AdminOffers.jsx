
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  X,
  Tag,
  CheckCircle2,
  LoaderCircle,
  CalendarDays,
  Percent,
  Layers3,
  Package,
  Clock3,
  Power,
  AlertCircle,
} from 'lucide-react';
import api from '../../utils/axios';

const OFFERS_ENDPOINT = '/api/admin/offers/';
const PRODUCTS_ENDPOINT = '/api/admin/products/';
const CATEGORIES_ENDPOINT = '/api/admin/products/categories/';

const EMPTY_FORM = {
  name: '',
  offer_type: 'PRODUCT',
  product: '',
  category: '',
  discount_type: 'PERCENTAGE',
  discount_value: '',
  maximum_discount: '',
  start_date: '',
  end_date: '',
  is_active: true,
};

const INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500 disabled:opacity-50';

const SELECT_CLASS =
  'w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none focus:border-violet-500 disabled:opacity-50';

function unwrap(response) {
  let body = response?.data;

  // Support { success, message, data } and directly returned payloads.
  if (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    Object.prototype.hasOwnProperty.call(body, 'data')
  ) {
    body = body.data;
  }

  return body;
}

function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const possibleLists = [
    payload.results,
    payload.items,
    payload.offers,
    payload.products,
    payload.categories,
  ];

  return possibleLists.find(Array.isArray) || [];
}

function getErrorMessage(error) {
  const body = error?.response?.data;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body?.detail) {
    return String(body.detail);
  }

  if (body?.message) {
    return String(body.message);
  }

  if (body && typeof body === 'object') {
    const messages = Object.entries(body)
      .map(([field, value]) => {
        let details = '';

        if (Array.isArray(value)) {
          details = value
            .map((item) =>
              typeof item === 'object'
                ? JSON.stringify(item)
                : String(item)
            )
            .join(', ');
        } else if (typeof value === 'string') {
          details = value;
        } else if (value && typeof value === 'object') {
          details = Object.values(value)
            .flat()
            .map(String)
            .join(', ');
        }

        return details ? `${field}: ${details}` : '';
      })
      .filter(Boolean);

    if (messages.length) {
      return messages.join(' | ');
    }
  }

  if (error?.response?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error?.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (!error?.response) {
    return 'Could not connect to the server. Check your connection and try again.';
  }

  return error?.message || 'Something went wrong. Please try again.';
}

function getItemName(item) {
  return (
    item?.name ||
    item?.title ||
    item?.product_name ||
    item?.category_name ||
    `Item #${item?.id ?? item?.pk ?? 'unknown'}`
  );
}

function getItemId(value) {
  if (value && typeof value === 'object') {
    return value.id ?? value.pk ?? '';
  }

  return value ?? '';
}

function toDateTimeLocal(value) {
  if (!value) {
    return '';
  }

  // Preserve local wall-clock time when the API returns a timezone-free value.
  if (typeof value === 'string') {
    const localMatch = value.match(
      /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/
    );

    if (localMatch && !/[zZ]$/.test(value)) {
      return `${localMatch[1]}T${localMatch[2]}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function toApiDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function getOfferTiming(offer) {
  const now = Date.now();
  const start = new Date(offer?.start_date).getTime();
  const end = new Date(offer?.end_date).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 'unknown';
  }

  if (now < start) {
    return 'scheduled';
  }

  if (now > end) {
    return 'expired';
  }

  return 'running';
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatDiscount(offer) {
  const value = Number(offer?.discount_value);

  if (!Number.isFinite(value)) {
    return '—';
  }

  if (offer.discount_type === 'PERCENTAGE') {
    return `${value}%`;
  }

  return `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

function getTargetLabel(offer, products, categories) {
  const productId = getItemId(offer?.product);
  const categoryId = getItemId(offer?.category);

  if (offer?.offer_type === 'PRODUCT') {
    const product = products.find(
      (item) =>
        String(item.id ?? item.pk) === String(productId)
    );

    return product
      ? getItemName(product)
      : productId
        ? `Product #${productId}`
        : 'Product not assigned';
  }

  const category = categories.find(
    (item) =>
      String(item.id ?? item.pk) === String(categoryId)
  );

  return category
    ? getItemName(category)
    : categoryId
      ? `Category #${categoryId}`
      : 'Category not assigned';
}

function Badge({ children, tone = 'muted' }) {
  const styles = {
    green: 'bg-emerald-500/10 text-emerald-300',
    red: 'bg-red-500/10 text-red-300',
    blue: 'bg-sky-500/10 text-sky-300',
    violet: 'bg-violet-500/10 text-violet-300',
    muted: 'bg-slate-500/15 text-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[tone] || styles.muted
      }`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ offer }) {
  const timing = getOfferTiming(offer);

  if (!offer.is_active) {
    return <Badge tone="muted">Inactive</Badge>;
  }

  if (timing === 'expired') {
    return <Badge tone="red">Expired</Badge>;
  }

  if (timing === 'scheduled') {
    return <Badge tone="blue">Scheduled</Badge>;
  }

  if (timing === 'running') {
    return <Badge tone="green">Running</Badge>;
  }

  return <Badge tone="muted">Unknown</Badge>;
}

function SummaryCard({ label, value, icon, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AlertMessage({ message, onDismiss, tone = 'error' }) {
  if (!message) {
    return null;
  }

  const isError = tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
        isError
          ? 'border-red-500/20 bg-red-500/10 text-red-300'
          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      )}

      <span className="break-words">{message}</span>

      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(OFFERS_ENDPOINT);
      setOffers(normalizeList(unwrap(response)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);

    try {
      const [productsResponse, categoriesResponse] =
        await Promise.all([
          api.get(PRODUCTS_ENDPOINT),
          api.get(CATEGORIES_ENDPOINT),
        ]);

      setProducts(normalizeList(unwrap(productsResponse)));
      setCategories(normalizeList(unwrap(categoriesResponse)));
    } catch (err) {
      setError(
        `Could not load product/category options. ${getErrorMessage(err)}`
      );
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialData() {
      const offersRequest = api.get(OFFERS_ENDPOINT);
      const productsRequest = api.get(PRODUCTS_ENDPOINT);
      const categoriesRequest = api.get(CATEGORIES_ENDPOINT);

      try {
        const [offersResponse, productsResponse, categoriesResponse] =
          await Promise.all([
            offersRequest,
            productsRequest,
            categoriesRequest,
          ]);

        if (cancelled) {
          return;
        }

        setOffers(normalizeList(unwrap(offersResponse)));
        setProducts(normalizeList(unwrap(productsResponse)));
        setCategories(normalizeList(unwrap(categoriesResponse)));
        setError('');
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingOptions(false);
        }
      }
    }

    void fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return offers.filter((offer) => {
      const target = getTargetLabel(offer, products, categories);

      const matchesSearch =
        !query ||
        String(offer.name || '').toLowerCase().includes(query) ||
        String(target).toLowerCase().includes(query) ||
        String(offer.id ?? '').includes(query);

      const matchesType =
        typeFilter === 'all' ||
        offer.offer_type === typeFilter;

      const timing = getOfferTiming(offer);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && offer.is_active === true) ||
        (statusFilter === 'inactive' && offer.is_active === false) ||
        (statusFilter === 'running' &&
          offer.is_active === true &&
          timing === 'running') ||
        (statusFilter === 'scheduled' &&
          offer.is_active === true &&
          timing === 'scheduled') ||
        (statusFilter === 'expired' &&
          offer.is_active === true &&
          timing === 'expired');

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [
    offers,
    products,
    categories,
    search,
    typeFilter,
    statusFilter,
  ]);

  const activeCount = offers.filter(
    (offer) => offer.is_active
  ).length;

  const inactiveCount = offers.length - activeCount;

  const runningCount = offers.filter(
    (offer) =>
      offer.is_active &&
      getOfferTiming(offer) === 'running'
  ).length;

  const expiredCount = offers.filter(
    (offer) =>
      offer.is_active &&
      getOfferTiming(offer) === 'expired'
  ).length;

  function openCreateModal() {
    const now = new Date();
    const end = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    setEditingOffer(null);
    setForm({
      ...EMPTY_FORM,
      start_date: toDateTimeLocal(now.toISOString()),
      end_date: toDateTimeLocal(end.toISOString()),
    });
    setFormError('');
    setError('');
    setModalOpen(true);
  }

  function openEditModal(offer) {
    setEditingOffer(offer);

    setForm({
      name: offer.name || '',
      offer_type: offer.offer_type || 'PRODUCT',
      product: getItemId(offer.product)
        ? String(getItemId(offer.product))
        : '',
      category: getItemId(offer.category)
        ? String(getItemId(offer.category))
        : '',
      discount_type: offer.discount_type || 'PERCENTAGE',
      discount_value: String(offer.discount_value ?? ''),
      maximum_discount:
        offer.maximum_discount == null
          ? ''
          : String(offer.maximum_discount),
      start_date: toDateTimeLocal(offer.start_date),
      end_date: toDateTimeLocal(offer.end_date),
      is_active: Boolean(offer.is_active),
    });

    setFormError('');
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingOffer(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'offer_type') {
        updated.product = '';
        updated.category = '';
      }

      if (name === 'discount_type' && value === 'FIXED') {
        updated.maximum_discount = '';
      }

      return updated;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError('');
    setNotice('');

    if (!form.name.trim()) {
      setFormError('Offer name is required.');
      return;
    }

    if (form.offer_type === 'PRODUCT' && !form.product) {
      setFormError('Please select a product for this offer.');
      return;
    }

    if (form.offer_type === 'CATEGORY' && !form.category) {
      setFormError('Please select a category for this offer.');
      return;
    }

    const discountValue = Number(form.discount_value);

    if (
      form.discount_value === '' ||
      !Number.isFinite(discountValue) ||
      discountValue < 0
    ) {
      setFormError(
        'Enter a valid discount value greater than or equal to zero.'
      );
      return;
    }

    if (
      form.discount_type === 'PERCENTAGE' &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      setFormError(
        'Percentage discount must be greater than 0 and at most 100%.'
      );
      return;
    }

    if (form.discount_type === 'FIXED' && discountValue <= 0) {
      setFormError('Fixed discount must be greater than zero.');
      return;
    }

    const maximumDiscount =
      form.maximum_discount === ''
        ? null
        : Number(form.maximum_discount);

    if (
      maximumDiscount !== null &&
      (!Number.isFinite(maximumDiscount) || maximumDiscount < 0)
    ) {
      setFormError(
        'Maximum discount must be a valid non-negative amount.'
      );
      return;
    }

    if (
      form.discount_type === 'FIXED' &&
      maximumDiscount !== null
    ) {
      setFormError(
        'Maximum discount is only available for percentage offers.'
      );
      return;
    }

    if (!form.start_date || !form.end_date) {
      setFormError('Start date and end date are required.');
      return;
    }

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setFormError('Please enter valid start and end dates.');
      return;
    }

    if (startDate >= endDate) {
      setFormError('End date must be after the start date.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      offer_type: form.offer_type,
      product:
        form.offer_type === 'PRODUCT'
          ? Number(form.product)
          : null,
      category:
        form.offer_type === 'CATEGORY'
          ? Number(form.category)
          : null,
      discount_type: form.discount_type,
      discount_value: discountValue,
      maximum_discount:
        form.discount_type === 'PERCENTAGE'
          ? maximumDiscount
          : null,
      start_date: toApiDateTime(form.start_date),
      end_date: toApiDateTime(form.end_date),
      is_active: form.is_active,
    };

    if (!payload.start_date || !payload.end_date) {
      setFormError('Invalid date format.');
      return;
    }

    setSaving(true);

    try {
      if (editingOffer) {
        await api.patch(
          `${OFFERS_ENDPOINT}${editingOffer.id}/`,
          payload
        );

        setNotice('Offer updated successfully.');
      } else {
        await api.post(OFFERS_ENDPOINT, payload);
        setNotice('Offer created successfully.');
      }

      setModalOpen(false);
      setEditingOffer(null);
      setForm(EMPTY_FORM);

      await loadOffers();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeOfferStatus(offer) {
    if (changingStatusId !== null) {
      return;
    }

    const activating = !offer.is_active;

    const confirmed = window.confirm(
      `${activating ? 'Activate' : 'Deactivate'} offer "${offer.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setChangingStatusId(offer.id);
    setError('');
    setNotice('');

    try {
      const action = activating ? 'activate' : 'deactivate';

      await api.patch(
        `${OFFERS_ENDPOINT}${offer.id}/${action}/`
      );

      setNotice(
        `Offer "${offer.name}" ${
          activating ? 'activated' : 'deactivated'
        } successfully.`
      );

      await loadOffers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setChangingStatusId(null);
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-violet-300">
            <Tag size={16} />
            <span>Sales and promotions</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Offer Management
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Create product and category discounts and manage
            promotional periods for LilBunny.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Plus size={18} />
          Create offer
        </button>
      </div>

      <AlertMessage
        message={notice}
        tone="success"
        onDismiss={() => setNotice('')}
      />

      <AlertMessage
        message={error}
        tone="error"
        onDismiss={() => setError('')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total offers"
          value={offers.length}
          icon={<Tag size={20} />}
          description="All promotional offers"
        />

        <SummaryCard
          label="Currently running"
          value={runningCount}
          icon={<CheckCircle2 size={20} />}
          description="Active and within date range"
        />

        <SummaryCard
          label="Inactive offers"
          value={inactiveCount}
          icon={<Power size={20} />}
          description="Manually deactivated"
        />

        <SummaryCard
          label="Expired offers"
          value={expiredCount}
          icon={<Clock3 size={20} />}
          description="Past their end date"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">All offers</h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredOffers.length} of {offers.length} offers shown
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadOffers();
              void loadOptions();
            }}
            disabled={loading || loadingOptions}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                loading || loadingOptions ? 'animate-spin' : ''
              }
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-white/10 p-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_190px]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search offers or targets..."
              aria-label="Search offers"
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by offer type"
            className={SELECT_CLASS}
          >
            <option value="all">All offer types</option>
            <option value="PRODUCT">Product offers</option>
            <option value="CATEGORY">Category offers</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
            className={SELECT_CLASS}
          >
            <option value="all">All statuses</option>
            <option value="active">Active offers</option>
            <option value="inactive">Inactive offers</option>
            <option value="running">Currently running</option>
            <option value="scheduled">Scheduled offers</option>
            <option value="expired">Expired offers</option>
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-400">
            <LoaderCircle
              size={20}
              className="animate-spin text-violet-400"
            />
            Loading offers...
          </div>
        ) : error && offers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-300">
              Offers could not be loaded.
            </p>

            <button
              type="button"
              onClick={() => void loadOffers()}
              className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Try again
            </button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <Tag size={23} />
            </div>

            <h3 className="font-medium text-white">
              {offers.length === 0
                ? 'No offers yet'
                : 'No matching offers'}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {offers.length === 0
                ? 'Create your first product or category offer.'
                : 'Try another search term or filter.'}
            </p>

            {offers.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Create offer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Offer</th>
                  <th className="px-5 py-4 font-medium">Target</th>
                  <th className="px-5 py-4 font-medium">Discount</th>
                  <th className="px-5 py-4 font-medium">Schedule</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {filteredOffers.map((offer) => (
                  <tr
                    key={offer.id ?? offer.pk}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                          {offer.offer_type === 'PRODUCT' ? (
                            <Package size={19} />
                          ) : (
                            <Layers3 size={19} />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {offer.name || 'Unnamed offer'}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            ID: {offer.id ?? offer.pk ?? '—'} ·{' '}
                            {offer.offer_type === 'PRODUCT'
                              ? 'Product offer'
                              : 'Category offer'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate font-medium text-slate-200">
                        {getTargetLabel(offer, products, categories)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {offer.offer_type === 'PRODUCT'
                          ? 'Specific product'
                          : 'Category-wide'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                          {offer.discount_type === 'PERCENTAGE' ? (
                            <Percent size={16} />
                          ) : (
                            <Tag size={16} />
                          )}
                        </span>

                        <div>
                          <p className="font-semibold text-white">
                            {formatDiscount(offer)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {offer.discount_type === 'PERCENTAGE'
                              ? 'Percentage'
                              : 'Fixed amount'}
                          </p>

                          {offer.maximum_discount != null &&
                            offer.discount_type === 'PERCENTAGE' && (
                              <p className="mt-1 text-xs text-slate-500">
                                Max ₹
                                {Number(
                                  offer.maximum_discount
                                ).toLocaleString('en-IN')}
                              </p>
                            )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <CalendarDays
                          size={15}
                          className="mt-0.5 shrink-0 text-slate-500"
                        />

                        <div className="space-y-1">
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-500">
                              From:{' '}
                            </span>
                            {formatDate(offer.start_date)}
                          </p>

                          <p className="text-xs text-slate-300">
                            <span className="text-slate-500">
                              Until:{' '}
                            </span>
                            {formatDate(offer.end_date)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge offer={offer} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(offer)}
                          title="Edit offer"
                          aria-label={`Edit ${offer.name || 'offer'}`}
                          className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => void changeOfferStatus(offer)}
                          disabled={changingStatusId !== null}
                          title={
                            offer.is_active
                              ? 'Deactivate offer'
                              : 'Activate offer'
                          }
                          aria-label={`${
                            offer.is_active ? 'Deactivate' : 'Activate'
                          } ${offer.name || 'offer'}`}
                          className={`rounded-lg border border-white/10 p-2 transition disabled:opacity-50 ${
                            offer.is_active
                              ? 'text-slate-300 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300'
                              : 'text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/10'
                          }`}
                        >
                          {changingStatusId === (offer.id ?? offer.pk) ? (
                            <LoaderCircle
                              size={15}
                              className="animate-spin"
                            />
                          ) : offer.is_active ? (
                            <Power size={15} />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
            aria-labelledby="offer-modal-title"
            className="my-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2
                  id="offer-modal-title"
                  className="text-lg font-semibold text-white"
                >
                  {editingOffer ? 'Edit offer' : 'Create offer'}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Configure the discount, target, and promotional dates.
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

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="break-words">{formError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="offer-name"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Offer name <span className="text-red-400">*</span>
                </label>

                <input
                  id="offer-name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  maxLength={150}
                  placeholder="e.g. Summer Baby Essentials"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="offer-type"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Offer type <span className="text-red-400">*</span>
                  </label>

                  <select
                    id="offer-type"
                    name="offer_type"
                    value={form.offer_type}
                    onChange={updateField}
                    className={SELECT_CLASS}
                  >
                    <option value="PRODUCT">Product offer</option>
                    <option value="CATEGORY">Category offer</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="offer-discount-type"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Discount type <span className="text-red-400">*</span>
                  </label>

                  <select
                    id="offer-discount-type"
                    name="discount_type"
                    value={form.discount_type}
                    onChange={updateField}
                    className={SELECT_CLASS}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed amount (₹)</option>
                  </select>
                </div>
              </div>

              {form.offer_type === 'PRODUCT' ? (
                <div>
                  <label
                    htmlFor="offer-product"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Product <span className="text-red-400">*</span>
                  </label>

                  <select
                    id="offer-product"
                    name="product"
                    value={form.product}
                    onChange={updateField}
                    required
                    disabled={loadingOptions}
                    className={SELECT_CLASS}
                  >
                    <option value="">
                      {loadingOptions
                        ? 'Loading products...'
                        : 'Select a product'}
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id ?? product.pk}
                        value={product.id ?? product.pk}
                      >
                        {getItemName(product)} (ID:{' '}
                        {product.id ?? product.pk})
                      </option>
                    ))}
                  </select>

                  {!loadingOptions && products.length === 0 && (
                    <p className="mt-2 text-xs text-amber-300">
                      No products were returned by the product API.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="offer-category"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Category <span className="text-red-400">*</span>
                  </label>

                  <select
                    id="offer-category"
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                    disabled={loadingOptions}
                    className={SELECT_CLASS}
                  >
                    <option value="">
                      {loadingOptions
                        ? 'Loading categories...'
                        : 'Select a category'}
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id ?? category.pk}
                        value={category.id ?? category.pk}
                      >
                        {getItemName(category)} (ID:{' '}
                        {category.id ?? category.pk})
                      </option>
                    ))}
                  </select>

                  {!loadingOptions && categories.length === 0 && (
                    <p className="mt-2 text-xs text-amber-300">
                      No categories were returned by the category API.
                    </p>
                  )}
                </div>
              )}

              <div
                className={`grid grid-cols-1 gap-4 ${
                  form.discount_type === 'PERCENTAGE'
                    ? 'sm:grid-cols-2'
                    : ''
                }`}
              >
                <div>
                  <label
                    htmlFor="offer-discount-value"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    {form.discount_type === 'PERCENTAGE'
                      ? 'Discount percentage (%)'
                      : 'Discount amount (₹)'}{' '}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    id="offer-discount-value"
                    name="discount_value"
                    type="number"
                    value={form.discount_value}
                    onChange={updateField}
                    required
                    min="0.01"
                    max={
                      form.discount_type === 'PERCENTAGE'
                        ? '100'
                        : undefined
                    }
                    step="0.01"
                    placeholder={
                      form.discount_type === 'PERCENTAGE' ? '10' : '100'
                    }
                    className={INPUT_CLASS}
                  />
                </div>

                {form.discount_type === 'PERCENTAGE' && (
                  <div>
                    <label
                      htmlFor="offer-maximum-discount"
                      className="mb-2 block text-sm font-medium text-slate-200"
                    >
                      Maximum discount (₹)
                    </label>

                    <input
                      id="offer-maximum-discount"
                      name="maximum_discount"
                      type="number"
                      value={form.maximum_discount}
                      onChange={updateField}
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      className={INPUT_CLASS}
                    />

                    <p className="mt-1.5 text-xs text-slate-500">
                      Leave blank for no maximum cap.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="offer-start-date"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Start date and time{' '}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    id="offer-start-date"
                    name="start_date"
                    type="datetime-local"
                    value={form.start_date}
                    onChange={updateField}
                    required
                    className={`${INPUT_CLASS} [color-scheme:dark]`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="offer-end-date"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    End date and time{' '}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    id="offer-end-date"
                    name="end_date"
                    type="datetime-local"
                    value={form.end_date}
                    onChange={updateField}
                    required
                    min={form.start_date || undefined}
                    className={`${INPUT_CLASS} [color-scheme:dark]`}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Offer is active
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    The offer will still follow its configured start and
                    end dates.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={updateField}
                  className="h-4 w-4 accent-violet-500"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || loadingOptions}
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
                    : editingOffer
                      ? 'Save changes'
                      : 'Create offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
