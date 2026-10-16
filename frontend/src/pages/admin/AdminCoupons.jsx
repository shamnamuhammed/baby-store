
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  TicketPercent,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  CalendarDays,
  IndianRupee,
  Users,
  ChevronLeft,
  ChevronRight,
  Power,
  AlertCircle,
} from 'lucide-react';

import api from '../../utils/axios';

const ENDPOINT = '/api/admin/coupons/';
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  code: '',
  discount_type: 'PERCENTAGE',
  discount_value: '',
  minimum_order_amount: '0',
  maximum_discount: '',
  valid_from: '',
  valid_to: '',
  usage_limit: '1',
  usage_per_user: true,
  is_active: true,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function unwrap(response) {
  const body = response?.data;
  return body?.data !== undefined ? body.data : body;
}

function normalizeCouponResponse(payload) {
  const results = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.coupons)
          ? payload.coupons
          : [];

  const count = Number(payload?.count);

  const totalCount =
    payload?.count !== undefined && Number.isFinite(count)
      ? count
      : results.length;

  const suppliedPages = Number(
    payload?.total_pages ?? payload?.totalPages,
  );

  const totalPages =
    Number.isFinite(suppliedPages) && suppliedPages > 0
      ? Math.floor(suppliedPages)
      : Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    results,
    totalCount,
    totalPages,
  };
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
      return 'You do not have permission to manage coupons.';
    case 404:
      return 'The coupon endpoint was not found. Check your Django URL configuration.';
    case 409:
      return 'This operation conflicts with the current coupon state.';
    default:
      return error?.message || 'Something went wrong. Please try again.';
  }
}

function toDateTimeLocal(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function toApiDateTime(value) {
  if (!value) return '';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ''
    : date.toISOString();
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function money(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function getCouponState(coupon) {
  if (!coupon.is_active) {
    return {
      label: 'Inactive',
      className: 'bg-slate-500/15 text-slate-400',
    };
  }

  const now = Date.now();
  const start = coupon.valid_from
    ? new Date(coupon.valid_from).getTime()
    : Number.NaN;
  const end = coupon.valid_to
    ? new Date(coupon.valid_to).getTime()
    : Number.NaN;

  if (Number.isFinite(start) && now < start) {
    return {
      label: 'Scheduled',
      className: 'bg-sky-500/10 text-sky-300',
    };
  }

  if (Number.isFinite(end) && now > end) {
    return {
      label: 'Expired',
      className: 'bg-amber-500/10 text-amber-300',
    };
  }

  const usageLimit = Number(coupon.usage_limit);
  const usedCount = Number(coupon.used_count ?? 0);

  if (
    usageLimit > 0 &&
    Number.isFinite(usedCount) &&
    usedCount >= usageLimit
  ) {
    return {
      label: 'Limit reached',
      className: 'bg-red-500/10 text-red-300',
    };
  }

  return {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-300',
  };
}

function getDiscountLabel(coupon) {
  if (coupon.discount_type === 'PERCENTAGE') {
    const hasCap =
      coupon.maximum_discount !== null &&
      coupon.maximum_discount !== undefined &&
      coupon.maximum_discount !== '';

    const cap = hasCap
      ? ` · max ${money(coupon.maximum_discount)}`
      : '';

    return `${coupon.discount_value}% off${cap}`;
  }

  return `${money(coupon.discount_value)} off`;
}

function createInitialForm(coupon) {
  if (coupon) {
    return {
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'PERCENTAGE',
      discount_value: String(coupon.discount_value ?? ''),
      minimum_order_amount: String(
        coupon.minimum_order_amount ?? '0',
      ),
      maximum_discount:
        coupon.maximum_discount === null ||
        coupon.maximum_discount === undefined
          ? ''
          : String(coupon.maximum_discount),
      valid_from: toDateTimeLocal(coupon.valid_from),
      valid_to: toDateTimeLocal(coupon.valid_to),
      usage_limit: String(coupon.usage_limit ?? '1'),
      usage_per_user: coupon.usage_per_user ?? true,
      is_active: coupon.is_active ?? true,
    };
  }

  return {
    ...EMPTY_FORM,
    valid_from: toDateTimeLocal(new Date().toISOString()),
    valid_to: toDateTimeLocal(
      new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Reusable components                                                        */
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
        aria-label="Dismiss notification"
        className="rounded-md p-1 opacity-80 transition hover:bg-white/10 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function StatusBadge({ coupon }) {
  const state = getCouponState(coupon);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium ${state.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {state.label}
    </span>
  );
}

function EmptyState({ hasCoupons, onCreate }) {
  return (
    <div className="px-5 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
        <TicketPercent size={25} />
      </div>

      <h3 className="mt-4 font-semibold text-white">
        {hasCoupons ? 'No matching coupons' : 'No coupons found'}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
        {hasCoupons
          ? 'Try another search term or change your filters.'
          : 'Create a coupon to start offering discounts to your customers.'}
      </p>

      {!hasCoupons && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Plus size={16} />
          Create coupon
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Coupon form modal                                                          */
/* -------------------------------------------------------------------------- */

function CouponModal({ coupon, saving, onClose, onSubmit }) {
  // The modal mounts only while open, so initialize the form directly.
  // This avoids synchronizing derived form state through an effect.
  const [form, setForm] = useState(() => createInitialForm(coupon));
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

    const code = form.code.trim().toUpperCase();
    const discountValue = Number(form.discount_value);
    const minimumAmount = Number(form.minimum_order_amount);
    const maximumDiscount =
      form.maximum_discount.trim() === ''
        ? null
        : Number(form.maximum_discount);
    const usageLimit = Number(form.usage_limit);

    const validFrom = new Date(form.valid_from);
    const validTo = new Date(form.valid_to);

    if (!coupon && !code) {
      setFormError('Coupon code is required.');
      return;
    }

    if (!coupon && !/^[A-Z0-9_-]+$/.test(code)) {
      setFormError(
        'Use only letters, numbers, hyphens, and underscores in the coupon code.',
      );
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    if (
      form.discount_type === 'PERCENTAGE' &&
      discountValue > 100
    ) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    if (
      form.discount_type === 'PERCENTAGE' &&
      maximumDiscount !== null &&
      (!Number.isFinite(maximumDiscount) || maximumDiscount < 0)
    ) {
      setFormError('Maximum discount must be zero or greater.');
      return;
    }

    if (
      !coupon &&
      form.discount_type === 'PERCENTAGE' &&
      maximumDiscount === null
    ) {
      setFormError(
        'Enter a maximum discount for percentage coupons.',
      );
      return;
    }

    if (
      !Number.isFinite(minimumAmount) ||
      minimumAmount < 0
    ) {
      setFormError(
        'Minimum order amount must be zero or greater.',
      );
      return;
    }

    if (!Number.isInteger(usageLimit) || usageLimit < 1) {
      setFormError(
        'Usage limit must be a whole number of at least 1.',
      );
      return;
    }

    if (
      !form.valid_from ||
      !form.valid_to ||
      Number.isNaN(validFrom.getTime()) ||
      Number.isNaN(validTo.getTime()) ||
      validFrom >= validTo
    ) {
      setFormError(
        'The expiry date and time must be later than the start date.',
      );
      return;
    }

    const payload = {
      discount_type: form.discount_type,
      discount_value: discountValue,
      maximum_discount:
        form.discount_type === 'PERCENTAGE'
          ? maximumDiscount
          : null,
      valid_from: toApiDateTime(form.valid_from),
      valid_to: toApiDateTime(form.valid_to),
      usage_limit: usageLimit,
      usage_per_user: form.usage_per_user,
      is_active: form.is_active,
    };

    if (!coupon) {
      payload.code = code;
      payload.minimum_order_amount = minimumAmount;
    }

    try {
      await onSubmit(payload);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-modal-title"
        className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-violet-300">
              <TicketPercent size={15} />
              Coupon management
            </div>

            <h2
              id="coupon-modal-title"
              className="text-xl font-semibold text-white"
            >
              {coupon ? 'Edit coupon' : 'Create coupon'}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Configure the discount, validity, and usage rules.
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

        <form
          onSubmit={handleFormSubmit}
          className="max-h-[calc(100vh-150px)] space-y-5 overflow-y-auto p-5"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="coupon-code"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Coupon code {!coupon && <span className="text-red-400">*</span>}
              </label>

              <input
                id="coupon-code"
                name="code"
                value={form.code}
                onChange={updateField}
                required={!coupon}
                disabled={Boolean(coupon)}
                maxLength={50}
                placeholder="e.g. BABY10"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm uppercase text-white outline-none placeholder:text-slate-500 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {coupon && (
                <p className="mt-1 text-xs text-slate-500">
                  Coupon code is not changed during editing.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="coupon-discount-type"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Discount type
              </label>

              <select
                id="coupon-discount-type"
                name="discount_type"
                value={form.discount_type}
                onChange={updateField}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="coupon-discount-value"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Discount value <span className="text-red-400">*</span>
              </label>

              <div className="relative">
                {form.discount_type === 'FIXED' ? (
                  <IndianRupee
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                ) : (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    %
                  </span>
                )}

                <input
                  id="coupon-discount-value"
                  name="discount_value"
                  type="number"
                  min="0.01"
                  max={
                    form.discount_type === 'PERCENTAGE'
                      ? '100'
                      : undefined
                  }
                  step="0.01"
                  value={form.discount_value}
                  onChange={updateField}
                  required
                  placeholder={
                    form.discount_type === 'PERCENTAGE' ? '10' : '100'
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-9 pr-4 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="coupon-maximum-discount"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Maximum discount (₹)
              </label>

              <input
                id="coupon-maximum-discount"
                name="maximum_discount"
                type="number"
                min="0"
                step="0.01"
                value={form.maximum_discount}
                onChange={updateField}
                disabled={form.discount_type === 'FIXED'}
                placeholder={
                  form.discount_type === 'PERCENTAGE'
                    ? 'e.g. 300'
                    : 'Not applicable'
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              />

              {form.discount_type === 'FIXED' && (
                <p className="mt-1 text-xs text-slate-500">
                  Maximum discount is used for percentage coupons.
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="coupon-minimum-order"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Minimum order amount (₹)
            </label>

            <input
              id="coupon-minimum-order"
              name="minimum_order_amount"
              type="number"
              min="0"
              step="0.01"
              value={form.minimum_order_amount}
              onChange={updateField}
              disabled={Boolean(coupon)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {coupon && (
              <p className="mt-1 text-xs text-slate-500">
                This field is not included in the current update payload.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="coupon-valid-from"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Valid from <span className="text-red-400">*</span>
              </label>

              <input
                id="coupon-valid-from"
                name="valid_from"
                type="datetime-local"
                value={form.valid_from}
                onChange={updateField}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="coupon-valid-to"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Valid until <span className="text-red-400">*</span>
              </label>

              <input
                id="coupon-valid-to"
                name="valid_to"
                type="datetime-local"
                value={form.valid_to}
                onChange={updateField}
                required
                min={form.valid_from || undefined}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="coupon-usage-limit"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Total usage limit
              </label>

              <input
                id="coupon-usage-limit"
                name="usage_limit"
                type="number"
                min="1"
                step="1"
                value={form.usage_limit}
                onChange={updateField}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <label className="flex w-full cursor-pointer items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium text-white">
                    Limit per user
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Restrict repeated use by each customer.
                  </span>
                </span>

                <input
                  type="checkbox"
                  name="usage_per_user"
                  checked={form.usage_per_user}
                  onChange={updateField}
                  className="h-4 w-4 shrink-0 accent-violet-500"
                />
              </label>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 p-4">
            <span>
              <span className="block text-sm font-medium text-white">
                Activate coupon
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                The coupon must still satisfy its validity dates and usage limit.
              </span>
            </span>

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
                : coupon
                  ? 'Save changes'
                  : 'Create coupon'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main admin coupons page                                                    */
/* -------------------------------------------------------------------------- */

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  /*
   * Reusable loader for refreshes and mutation follow-ups.
   * The page is passed explicitly so the callback remains stable.
   */
  const loadCoupons = useCallback(async (requestedPage) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(ENDPOINT, {
        params: {
          page: requestedPage,
          page_size: PAGE_SIZE,
        },
      });

      const normalized = normalizeCouponResponse(unwrap(response));

      setCoupons(normalized.results);
      setTotalCount(normalized.totalCount);
      setTotalPages(normalized.totalPages);

      return normalized;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Fetch whenever the selected page changes.
   * The cancellation flag prevents stale requests from updating the page
   * after this effect has been cleaned up.
   */
  useEffect(() => {
    let cancelled = false;

    async function fetchPage() {
      try {
        const response = await api.get(ENDPOINT, {
          params: {
            page,
            page_size: PAGE_SIZE,
          },
        });

        if (cancelled) return;

        const normalized = normalizeCouponResponse(unwrap(response));

        setCoupons(normalized.results);
        setTotalCount(normalized.totalCount);
        setTotalPages(normalized.totalPages);
        setError('');
      } catch (requestError) {
        if (cancelled) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchPage();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const filteredCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const matchesSearch =
        !query ||
        String(coupon.code || '').toLowerCase().includes(query) ||
        String(coupon.id || '').includes(query);

      const state = getCouponState(coupon);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && state.label === 'Active') ||
        (statusFilter === 'inactive' && !coupon.is_active) ||
        (statusFilter === 'scheduled' && state.label === 'Scheduled') ||
        (statusFilter === 'expired' && state.label === 'Expired') ||
        (statusFilter === 'limit' && state.label === 'Limit reached');

      const matchesType =
        typeFilter === 'all' ||
        coupon.discount_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  const activeCount = coupons.filter(
    (coupon) => getCouponState(coupon).label === 'Active',
  ).length;

  const inactiveCount = coupons.filter(
    (coupon) => !coupon.is_active,
  ).length;

  const usageTotal = coupons.reduce(
    (total, coupon) => total + Number(coupon.used_count || 0),
    0,
  );

  function openCreateModal() {
    setEditingCoupon(null);
    setModalOpen(true);
    setError('');
    setNotice('');
  }

  function openEditModal(coupon) {
    setEditingCoupon(coupon);
    setModalOpen(true);
    setError('');
    setNotice('');
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingCoupon(null);
  }

  async function handleSubmit(payload) {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingCoupon) {
        await api.patch(
          `${ENDPOINT}${editingCoupon.id}/`,
          payload,
        );

        setNotice(
          `Coupon "${editingCoupon.code}" updated successfully.`,
        );
      } else {
        await api.post(ENDPOINT, payload);

        setNotice(
          `Coupon "${payload.code}" created successfully.`,
        );
      }

      setModalOpen(false);
      setEditingCoupon(null);

      if (!editingCoupon && page !== 1) {
        // The page effect will fetch page 1 after this state change.
        setLoading(true);
        setPage(1);
      } else {
        await loadCoupons(page);
      }
    } finally {
      // The modal catches and displays API errors from this function.
      setSaving(false);
    }
  }

  async function handleToggle(coupon) {
    const activate = !coupon.is_active;
    const action = activate ? 'activate' : 'deactivate';

    const confirmed = window.confirm(
      `${activate ? 'Activate' : 'Deactivate'} coupon "${coupon.code}"?`,
    );

    if (!confirmed) return;

    setWorkingId(coupon.id);
    setError('');
    setNotice('');

    try {
      await api.patch(`${ENDPOINT}${coupon.id}/`, {
        is_active: activate,
      });

      setNotice(
        `Coupon "${coupon.code}" ${action}d successfully.`,
      );

      await loadCoupons(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDelete(coupon) {
    const confirmed = window.confirm(
      `Delete coupon "${coupon.code}"?\n\nConfirm only if your backend DELETE action is designed to deactivate the coupon rather than permanently remove it.`,
    );

    if (!confirmed) return;

    setWorkingId(coupon.id);
    setError('');
    setNotice('');

    try {
      await api.delete(`${ENDPOINT}${coupon.id}/`);

      setNotice(
        `Coupon "${coupon.code}" deleted successfully.`,
      );

      const result = await loadCoupons(page);

      if (
        result &&
        result.results.length === 0 &&
        page > 1
      ) {
        // Move back when deleting the last item on the current page.
        setLoading(true);
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setWorkingId(null);
    }
  }

  function changePage(nextPage) {
    const boundedPage = Math.min(
      totalPages,
      Math.max(1, nextPage),
    );

    if (boundedPage !== page) {
      setLoading(true);
      setPage(boundedPage);
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-violet-300">
            <TicketPercent size={16} />
            <span>Marketing management</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Coupons
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Create discount campaigns and manage coupon validity and usage.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:bg-violet-500"
        >
          <Plus size={18} />
          Create coupon
        </button>
      </header>

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Coupons on this page"
          value={coupons.length}
          icon={TicketPercent}
          description="Coupons loaded from the API"
        />

        <SummaryCard
          label="Currently active"
          value={activeCount}
          icon={CheckCircle2}
          description="Active and within validity rules"
        />

        <SummaryCard
          label="Inactive coupons"
          value={inactiveCount}
          icon={XCircle}
          description="Disabled coupons on this page"
        />

        <SummaryCard
          label="Uses on this page"
          value={usageTotal}
          icon={Users}
          description="Recorded uses on this page"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/5">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">All coupons</h2>
            <p className="mt-1 text-xs text-slate-400">
              {filteredCoupons.length} shown on this page · {totalCount} total
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadCoupons(page)}
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

        <div className="grid grid-cols-1 gap-3 border-b border-white/10 p-4 md:grid-cols-3">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search coupon code or ID..."
              aria-label="Search coupons"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter coupons by status"
            className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 outline-none focus:border-violet-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active now</option>
            <option value="inactive">Inactive</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="limit">Usage limit reached</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter coupons by discount type"
            className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 outline-none focus:border-violet-500"
          >
            <option value="all">All discount types</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed amount</option>
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400">
            <LoaderCircle
              size={21}
              className="animate-spin text-violet-400"
            />
            Loading coupons...
          </div>
        ) : error && coupons.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <AlertCircle
              size={28}
              className="mx-auto text-red-300"
            />

            <h3 className="mt-4 font-semibold text-white">
              Coupons could not be loaded
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Check that your backend is running and the admin coupon endpoint is correct.
            </p>

            <button
              type="button"
              onClick={() => loadCoupons(page)}
              className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Try again
            </button>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <EmptyState
            hasCoupons={coupons.length > 0}
            onCreate={openCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Coupon</th>
                  <th className="px-5 py-4 font-medium">Discount</th>
                  <th className="px-5 py-4 font-medium">Minimum order</th>
                  <th className="px-5 py-4 font-medium">Usage</th>
                  <th className="px-5 py-4 font-medium">Validity</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {filteredCoupons.map((coupon) => {
                  const used = Number(coupon.used_count || 0);
                  const limit = Number(coupon.usage_limit || 0);

                  const usagePercent =
                    limit > 0
                      ? Math.min(
                          100,
                          Math.round((used / limit) * 100),
                        )
                      : 0;

                  const working = workingId === coupon.id;

                  return (
                    <tr
                      key={coupon.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                            <TicketPercent size={19} />
                          </div>

                          <div>
                            <p className="font-semibold tracking-wide text-white">
                              {coupon.code || 'Unnamed coupon'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              ID: {coupon.id ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-violet-300">
                          {getDiscountLabel(coupon)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {coupon.discount_type === 'PERCENTAGE'
                            ? 'Percentage discount'
                            : 'Fixed discount'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {money(coupon.minimum_order_amount)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="min-w-28">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-slate-300">
                              {used} / {limit}
                            </span>
                            <span className="text-slate-500">
                              {usagePercent}%
                            </span>
                          </div>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-violet-500 transition-all"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            {coupon.usage_per_user
                              ? 'Per-user limit enabled'
                              : 'Per-user limit disabled'}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-2 text-xs">
                          <p className="flex items-start gap-2 text-slate-300">
                            <CalendarDays
                              size={14}
                              className="mt-0.5 shrink-0 text-emerald-400"
                            />
                            <span>
                              <span className="block text-slate-500">
                                From
                              </span>
                              {formatDate(coupon.valid_from)}
                            </span>
                          </p>

                          <p className="flex items-start gap-2 text-slate-300">
                            <CalendarDays
                              size={14}
                              className="mt-0.5 shrink-0 text-amber-400"
                            />
                            <span>
                              <span className="block text-slate-500">
                                Until
                              </span>
                              {formatDate(coupon.valid_to)}
                            </span>
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge coupon={coupon} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(coupon)}
                            disabled={working || saving}
                            title="Edit coupon"
                            aria-label={`Edit coupon ${coupon.code}`}
                            className="rounded-lg border border-white/10 p-2.5 text-slate-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggle(coupon)}
                            disabled={working || saving}
                            title={
                              coupon.is_active
                                ? 'Deactivate coupon'
                                : 'Activate coupon'
                            }
                            aria-label={`${
                              coupon.is_active ? 'Deactivate' : 'Activate'
                            } coupon ${coupon.code}`}
                            className={`rounded-lg border border-white/10 p-2.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              coupon.is_active
                                ? 'text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/10'
                                : 'text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/10'
                            }`}
                          >
                            {working ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Power size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(coupon)}
                            disabled={working || saving}
                            title="Delete coupon"
                            aria-label={`Delete coupon ${coupon.code}`}
                            className="rounded-lg border border-white/10 p-2.5 text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={15} />
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

        <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Page {page} of {totalPages} · {totalCount} total coupons
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changePage(page - 1)}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              type="button"
              onClick={() => changePage(page + 1)}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <CouponModal
          key={editingCoupon?.id ?? 'new-coupon'}
          coupon={editingCoupon}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
