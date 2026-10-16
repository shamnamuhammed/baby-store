
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  UserRound,
  CalendarDays,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';
import api from '../../utils/axios';

const ENDPOINT = '/api/admin/orders/';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_STYLES = {
  pending: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  confirmed: 'bg-blue-400/10 text-blue-300 ring-blue-400/20',
  shipped: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  delivered: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  cancelled: 'bg-red-400/10 text-red-300 ring-red-400/20',
};

function unwrap(response) {
  return response?.data ?? response;
}

function normalizeOrderList(response) {
  const body = unwrap(response);
  const payload = body?.data ?? body;

  if (Array.isArray(payload)) {
    return {
      orders: payload,
      count: payload.length,
      next: null,
      previous: null,
    };
  }

  const orders =
    payload?.results ??
    payload?.items ??
    payload?.orders ??
    [];

  return {
    orders: Array.isArray(orders) ? orders : [],
    count: Number(payload?.count ?? payload?.total ?? orders.length),
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
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
    return Object.entries(body)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.join(', ')
          : typeof value === 'string'
            ? value
            : JSON.stringify(value);

        return `${key}: ${message}`;
      })
      .join(' | ');
  }

  return error?.message || 'Something went wrong. Please try again.';
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function displayStatus(status) {
  return String(status ?? 'Unknown')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }) {
  const normalized = String(status ?? '').toLowerCase();

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[normalized] ??
        'bg-slate-800 text-slate-300 ring-white/10'
      }`}
    >
      {displayStatus(status)}
    </span>
  );
}

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({ order, onClose, onStatusUpdated }) {
  const currentStatus = String(order.status ?? '').toUpperCase();

  // The modal is keyed by order ID and status, so it remounts when
  // the saved status changes. No effect is needed to synchronize state.
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allowedStatuses = STATUS_TRANSITIONS[currentStatus] ?? [];
  const address = order.shipping_address;
  const items = Array.isArray(order.items) ? order.items : [];

  async function handleStatusUpdate() {
    if (
      !selectedStatus ||
      selectedStatus === currentStatus ||
      !allowedStatuses.includes(selectedStatus)
    ) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await api.patch(`${ENDPOINT}${order.id}/`, {
        status: selectedStatus,
      });

      const body = unwrap(response);
      const updatedOrder = body?.data ?? body;

      if (!updatedOrder || typeof updatedOrder !== 'object') {
        throw new Error(
          'The server did not return the updated order. Refresh and verify its status.'
        );
      }

      onStatusUpdated({
        ...order,
        ...updatedOrder,
        id: updatedOrder.id ?? order.id,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-slate-100 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div>
            <h2
              id="order-details-title"
              className="text-xl font-bold text-white"
            >
              Order #{order.id}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Placed {formatDate(order.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            aria-label="Close order details"
          >
            <X size={21} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-7">
          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold text-white">
                <UserRound size={18} className="text-violet-300" />
                Customer
              </div>

              <p className="font-medium text-slate-200">
                {order.customer_name || 'Customer name unavailable'}
              </p>
              <p className="mt-1 break-all text-sm text-slate-400">
                {order.customer_email || 'Email unavailable'}
              </p>
            </section>

            <section className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold text-white">
                <MapPin size={18} className="text-violet-300" />
                Shipping address
              </div>

              {address ? (
                <div className="space-y-1 text-sm text-slate-300">
                  <p className="font-medium text-white">
                    {address.full_name || '—'}
                  </p>
                  <p>{address.phone_number || '—'}</p>
                  <p>{address.address_line || '—'}</p>

                  {address.address_line_2 && (
                    <p>{address.address_line_2}</p>
                  )}

                  <p>
                    {[address.city, address.state, address.postal_code]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                  <p>{address.country || '—'}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No shipping address available.
                </p>
              )}
            </section>
          </div>

          <section className="mt-5 rounded-xl border border-white/10 bg-slate-950/30 p-4">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Package size={18} className="text-violet-300" />
              Ordered items ({items.length})
            </h3>

            {items.length === 0 ? (
              <p className="text-sm text-slate-400">
                No items were returned for this order.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id ?? `${item.product ?? 'product'}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-slate-200">
                        {item.product_name || `Product #${item.product ?? '—'}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.product_sku
                          ? `SKU: ${item.product_sku} · `
                          : ''}
                        Qty: {item.quantity ?? 0}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(item.unit_price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-5 rounded-xl border border-white/10 bg-slate-950/30 p-4">
            <h3 className="mb-4 font-semibold text-white">Order summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-slate-400">
                <span>Total amount</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>

              <div className="flex justify-between gap-4 text-slate-400">
                <span>Discount</span>
                <span>- {formatCurrency(order.discount_amount)}</span>
              </div>

              <div className="flex justify-between gap-4 border-t border-white/10 pt-3 text-base font-bold text-white">
                <span>Final amount</span>
                <span>{formatCurrency(order.final_amount)}</span>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-white/10 bg-slate-950/30 p-4">
            <h3 className="mb-3 font-semibold text-white">
              Update order status
            </h3>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                disabled={saving || allowedStatuses.length === 0}
                aria-label="Select new order status"
                className="min-h-11 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option className="bg-slate-900 text-white" value={currentStatus}>
                  Current: {displayStatus(currentStatus)}
                </option>

                {allowedStatuses.map((status) => (
                  <option
                    className="bg-slate-900 text-white"
                    key={status}
                    value={status}
                  >
                    {displayStatus(status)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={
                  saving ||
                  !selectedStatus ||
                  selectedStatus === currentStatus ||
                  !allowedStatuses.includes(selectedStatus)
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                {saving ? 'Updating...' : 'Save status'}
              </button>
            </div>

            {allowedStatuses.length === 0 && (
              <p className="mt-3 text-xs text-slate-400">
                This order has reached a final status and cannot be advanced
                further.
              </p>
            )}
          </section>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <CalendarDays size={15} />
            Last updated: {formatDate(order.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);

  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetching is handled directly in the effect with cancellation protection.
  // Loading is set by user actions, avoiding synchronous state updates at
  // the beginning of the effect.
  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      const params = { page, ordering };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      try {
        const response = await api.get(ENDPOINT, { params });

        if (cancelled) return;

        const result = normalizeOrderList(response);

        setOrders(result.orders);
        setCount(result.count);
        setHasNext(Boolean(result.next));
        setHasPrevious(Boolean(result.previous));
        setError('');
      } catch (err) {
        if (cancelled) return;

        setOrders([]);
        setCount(0);
        setHasNext(false);
        setHasPrevious(false);
        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [page, ordering, search, statusFilter, refreshKey]);

  const summary = useMemo(() => {
    const totals = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    // These counts describe the currently loaded page only.
    orders.forEach((order) => {
      const status = String(order.status ?? '').toLowerCase();

      if (Object.hasOwn(totals, status)) {
        totals[status] += 1;
      }
    });

    return totals;
  }, [orders]);

  function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleFilterChange(value) {
    setLoading(true);
    setError('');
    setPage(1);
    setStatusFilter(value);
  }

  function handleOrderingChange(value) {
    setLoading(true);
    setError('');
    setPage(1);
    setOrdering(value);
  }

  function handleRefresh() {
    setLoading(true);
    setError('');
    setRefreshKey((key) => key + 1);
  }

  function handleClearFilters() {
    setLoading(true);
    setError('');
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setPage(1);
  }

  function handleOrderUpdated(updatedOrder) {
    if (!updatedOrder?.id) {
      setSelectedOrder(null);
      handleRefresh();
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === updatedOrder.id
          ? { ...order, ...updatedOrder }
          : order
      )
    );

    setSelectedOrder((current) =>
      current?.id === updatedOrder.id
        ? { ...current, ...updatedOrder }
        : current
    );
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || loading) return;

    setLoading(true);
    setError('');
    setPage(nextPage);
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-violet-300">
              LilBunny Administration
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Order Management
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Review orders, inspect customer details, and manage fulfillment.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-slate-900 px-4 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-white/5 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            title="Orders on this page"
            value={orders.length}
            icon={Package}
            color="bg-violet-500/10 text-violet-300"
          />
          <SummaryCard
            title="Pending"
            value={summary.pending}
            icon={Clock}
            color="bg-amber-500/10 text-amber-300"
          />
          <SummaryCard
            title="Confirmed"
            value={summary.confirmed}
            icon={CheckCircle2}
            color="bg-blue-500/10 text-blue-300"
          />
          <SummaryCard
            title="Shipped"
            value={summary.shipped}
            icon={Truck}
            color="bg-indigo-500/10 text-indigo-300"
          />
          <SummaryCard
            title="Delivered"
            value={summary.delivered}
            icon={CheckCircle2}
            color="bg-emerald-500/10 text-emerald-300"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-sm">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_200px_220px_auto]"
            >
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search order ID or customer..."
                  aria-label="Search orders"
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => handleFilterChange(event.target.value)}
                aria-label="Filter by order status"
                className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-violet-500"
              >
                <option className="bg-slate-900 text-white" value="">
                  All statuses
                </option>
                {ORDER_STATUSES.map((status) => (
                  <option
                    className="bg-slate-900 text-white"
                    key={status.value}
                    value={status.value}
                  >
                    {displayStatus(status.label)}
                  </option>
                ))}
              </select>

              <select
                value={ordering}
                onChange={(event) => handleOrderingChange(event.target.value)}
                aria-label="Sort orders"
                className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-violet-500"
              >
                <option className="bg-slate-900 text-white" value="-created_at">
                  Newest first
                </option>
                <option className="bg-slate-900 text-white" value="created_at">
                  Oldest first
                </option>
                <option className="bg-slate-900 text-white" value="-total_amount">
                  Highest amount
                </option>
                <option className="bg-slate-900 text-white" value="total_amount">
                  Lowest amount
                </option>
                <option className="bg-slate-900 text-white" value="status">
                  Status A–Z
                </option>
              </select>

              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Search size={17} />
                Search
              </button>
            </form>

            {(search || statusFilter) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 text-sm font-medium text-violet-300 hover:text-violet-200"
              >
                Clear search and filters
              </button>
            )}
          </div>

          {error && (
            <div className="m-4 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Could not load orders</p>
                <p className="mt-1 break-words">{error}</p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-2 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Order</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Items</th>
                  <th className="px-5 py-4 font-semibold">Final amount</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <LoaderCircle
                        size={28}
                        className="mx-auto animate-spin text-violet-400"
                      />
                      <p className="mt-3 text-sm text-slate-400">
                        Loading orders...
                      </p>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Package
                        size={34}
                        className="mx-auto text-slate-600"
                      />
                      <p className="mt-3 font-semibold text-white">
                        No orders found
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4 font-semibold text-white">
                        #{order.id}
                      </td>

                      <td className="max-w-[220px] px-5 py-4">
                        <p className="truncate font-medium text-slate-200">
                          {order.customer_name || '—'}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {order.customer_email || '—'}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {Array.isArray(order.items)
                          ? order.items.reduce(
                              (total, item) =>
                                total + Number(item.quantity || 0),
                              0
                            )
                          : 0}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-white">
                        {formatCurrency(order.final_amount)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-300"
                        >
                          <Eye size={15} />
                          View details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-400">
              {count > 0
                ? `${count} order${count === 1 ? '' : 's'} matching your query`
                : 'No matching orders'}
              {' · '}Page {page}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || !hasPrevious}
                onClick={() => handlePageChange(page - 1)}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                disabled={loading || !hasNext}
                onClick={() => handlePageChange(page + 1)}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        <p className="text-xs leading-5 text-slate-500">
          Order status changes are validated by your Django backend. The
          summary cards reflect the orders on the currently loaded page.
        </p>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          key={`${selectedOrder.id}-${selectedOrder.status}`}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
}
