
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';

const DASHBOARD_ENDPOINT = '/api/admin/products/dashboard/';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const number = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value ?? 0));

const dateLabel = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const monthLabel = (value) => {
  if (!value) return '—';

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
  });
};

const statusStyle = {
  PENDING: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  CONFIRMED: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  PROCESSING: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  SHIPPED: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
  DELIVERED: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  CANCELLED: 'border-red-400/20 bg-red-400/10 text-red-300',
  RETURNED: 'border-orange-400/20 bg-orange-400/10 text-orange-300',
};

const orderStatusColors = {
  PENDING: 'bg-amber-400',
  CONFIRMED: 'bg-blue-400',
  PROCESSING: 'bg-blue-400',
  SHIPPED: 'bg-violet-400',
  DELIVERED: 'bg-emerald-400',
  CANCELLED: 'bg-red-400',
  RETURNED: 'bg-orange-400',
};

function getErrorMessage(error) {
  const body = error?.response?.data;

  if (typeof body?.message === 'string') {
    return body.message;
  }

  if (typeof body?.detail === 'string') {
    return body.detail;
  }

  if (error?.response?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error?.response?.status === 403) {
    return 'You do not have permission to access the admin dashboard.';
  }

  if (!error?.response) {
    return (
      error?.message ||
      'Unable to connect to the server. Check your backend connection and try again.'
    );
  }

  return error?.message || 'Unable to load dashboard data. Please try again.';
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function normalizeDashboard(responseData) {
  let payload = responseData?.data ?? responseData;

  // Support an additional nested API response structure.
  if (
    payload?.data &&
    !payload?.statistics &&
    typeof payload.data === 'object'
  ) {
    payload = payload.data;
  }

  if (payload?.success === false) {
    throw new Error(payload.message || 'Unable to load dashboard data.');
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('The dashboard API returned an invalid response.');
  }

  const statistics = payload.statistics ?? payload.stats ?? null;

  if (!statistics || typeof statistics !== 'object') {
    throw new Error(
      'Dashboard statistics are missing. Check the dashboard API response.'
    );
  }

  return {
    ...payload,
    statistics,
    recent_orders: normalizeArray(payload.recent_orders),
    low_stock_products: normalizeArray(payload.low_stock_products),
    top_selling_products: normalizeArray(payload.top_selling_products),
    latest_users: normalizeArray(payload.latest_users),
    monthly_revenue: normalizeArray(payload.monthly_revenue),
    monthly_orders: normalizeArray(payload.monthly_orders),
    order_status_chart: normalizeArray(payload.order_status_chart),
  };
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-white/[0.08] bg-[#111114] p-5 sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-white">{title}</h2>

          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {children}
    </section>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
  index,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 transition hover:border-white/[0.16] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon size={21} />
        </div>

        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Live data
        </span>
      </div>

      <p className="mt-5 text-sm text-zinc-400">{title}</p>

      <p className="mt-1 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-500">{description}</p>
    </motion.div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}

function MonthlyBarChart({
  items,
  valueKey,
  colorClass,
  formatValue,
}) {
  if (!items.length) {
    return <EmptyState message="No monthly data available yet." />;
  }

  const maximum = Math.max(
    ...items.map((item) => Number(item[valueKey] ?? 0)),
    1
  );

  return (
    <div className="flex h-[210px] items-end gap-3 overflow-x-auto px-1 pt-5">
      {items.map((item, index) => {
        const value = Number(item[valueKey] ?? 0);
        const height =
          value > 0 ? Math.max((value / maximum) * 100, 5) : 0;

        return (
          <div
            key={`${item.month ?? 'month'}-${index}`}
            className="flex h-full min-w-[46px] flex-1 flex-col items-center justify-end gap-3"
          >
            <div className="flex w-full flex-1 items-end justify-center">
              <div className="flex h-full w-full max-w-12 items-end">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${colorClass}`}
                  style={{ height: `${height}%` }}
                  title={`${monthLabel(item.month)}: ${formatValue(value)}`}
                />
              </div>
            </div>

            <span className="whitespace-nowrap text-[10px] text-zinc-500">
              {monthLabel(item.month)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Manual refresh/retry handler.
   *
   * This is called by user interactions, not by the initial effect.
   */
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(DASHBOARD_ENDPOINT);
      const payload = normalizeDashboard(response.data);

      setDashboard(payload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial dashboard request.
   *
   * The async request is performed directly in the effect instead of
   * calling loadDashboard(), which synchronously sets React state.
   * Cancellation prevents updates after unmount.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const response = await api.get(DASHBOARD_ENDPOINT, {
          signal: controller.signal,
        });

        if (cancelled || controller.signal.aborted) {
          return;
        }

        const payload = normalizeDashboard(response.data);

        setDashboard(payload);
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

    void fetchDashboard();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const stats = dashboard?.statistics ?? {};

  const recentOrders = dashboard?.recent_orders ?? [];
  const lowStock = dashboard?.low_stock_products ?? [];
  const topProducts = dashboard?.top_selling_products ?? [];
  const latestUsers = dashboard?.latest_users ?? [];
  const monthlyRevenue = dashboard?.monthly_revenue ?? [];
  const monthlyOrders = dashboard?.monthly_orders ?? [];
  const orderStatuses = dashboard?.order_status_chart ?? [];

  const statCards = [
    {
      title: 'Total revenue',
      value: money(stats.total_revenue),
      description: 'Revenue from delivered orders',
      icon: IndianRupee,
      accent: 'bg-emerald-400/10 text-emerald-300',
    },
    {
      title: 'Total orders',
      value: number(stats.total_orders),
      description: `${number(stats.pending_orders)} pending orders`,
      icon: ShoppingCart,
      accent: 'bg-blue-400/10 text-blue-300',
    },
    {
      title: 'Total products',
      value: number(stats.total_products),
      description: `${number(stats.active_products)} active products`,
      icon: Package,
      accent: 'bg-violet-400/10 text-violet-300',
    },
    {
      title: 'Total customers',
      value: number(stats.total_users),
      description: 'Registered accounts',
      icon: Users,
      accent: 'bg-amber-400/10 text-amber-300',
    },
  ];

  const totalStatusOrders = orderStatuses.reduce(
    (sum, item) => sum + Number(item.count ?? 0),
    0
  );

  const inventorySummary = [
    {
      label: 'Active',
      value: Number(stats.active_products ?? 0),
      color: 'bg-emerald-400',
    },
    {
      label: 'Inactive',
      value: Number(stats.inactive_products ?? 0),
      color: 'bg-zinc-500',
    },
  ];

  // Initial loading state.
  if (loading && !dashboard) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-400" />

        <p className="text-sm text-zinc-400">
          Loading your store overview...
        </p>
      </div>
    );
  }

  // Error state when there is no previously loaded dashboard.
  if (error && !dashboard) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-300">
          <AlertTriangle size={30} />
        </div>

        <h1 className="mt-5 text-xl font-semibold text-white">
          Dashboard unavailable
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {error}
        </p>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Try again
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5 text-xs text-violet-300">
            <Sparkles size={14} />
            Store performance
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Dashboard<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            A live overview of your BabyBliss store.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh data
        </button>
      </div>

      {/* Refresh error while preserving previously loaded data */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm text-amber-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error} Showing the last successfully loaded data.</p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="shrink-0 font-semibold underline underline-offset-4 disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <StatCard
            key={card.title}
            {...card}
            index={index}
          />
        ))}
      </div>

      {/* Revenue and order status */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel
          title="Monthly revenue"
          subtitle="Revenue grouped by order month"
          className="xl:col-span-2"
          action={
            <TrendingUp
              size={19}
              className="text-emerald-300"
            />
          }
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-2xl font-bold text-white">
              {money(stats.total_revenue)}
            </p>

            <span className="text-xs text-zinc-500">
              Delivered orders only
            </span>
          </div>

          <MonthlyBarChart
            items={monthlyRevenue}
            valueKey="revenue"
            colorClass="bg-gradient-to-t from-violet-600 to-fuchsia-400"
            formatValue={money}
          />
        </Panel>

        <Panel
          title="Order status"
          subtitle={`${number(stats.total_orders)} total orders`}
          action={
            <Activity
              size={19}
              className="text-blue-300"
            />
          }
        >
          {orderStatuses.length ? (
            <div className="space-y-5">
              {orderStatuses.map((item, index) => {
                const status = String(
                  item.status ?? 'UNKNOWN'
                ).toUpperCase();

                const count = Number(item.count ?? 0);

                const percentage = totalStatusOrders
                  ? (count / totalStatusOrders) * 100
                  : 0;

                return (
                  <div key={`${status}-${index}`}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-zinc-400">{status}</span>

                      <span className="font-semibold text-white">
                        {number(count)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          orderStatusColors[status] ?? 'bg-zinc-400'
                        }`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No order status data available." />
          )}
        </Panel>
      </div>

      {/* Monthly orders and inventory */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title="Monthly orders"
          subtitle="Orders created in each month"
          action={
            <ShoppingBag
              size={19}
              className="text-blue-300"
            />
          }
        >
          <MonthlyBarChart
            items={monthlyOrders}
            valueKey="total_orders"
            colorClass="bg-gradient-to-t from-blue-600 to-cyan-300"
            formatValue={number}
          />
        </Panel>

        <Panel
          title="Product inventory"
          subtitle="Active and inactive product overview"
          action={
            <Boxes
              size={19}
              className="text-violet-300"
            />
          }
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold text-white">
                {number(stats.total_products)}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Total products
              </p>
            </div>

            <p className="text-sm text-zinc-400">
              {number(stats.total_categories)} categories
              {' · '}
              {number(stats.total_brands)} brands
            </p>
          </div>

          <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-white/[0.06]">
            {inventorySummary.map((item) => {
              const total = Number(stats.total_products ?? 0);

              const percent = total
                ? (item.value / total) * 100
                : 0;

              return (
                <div
                  key={item.label}
                  className={item.color}
                  style={{ width: `${percent}%` }}
                  title={`${item.label}: ${number(item.value)}`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {inventorySummary.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span
                    className={`h-2 w-2 rounded-full ${item.color}`}
                  />
                  {item.label} products
                </div>

                <p className="mt-2 text-xl font-bold text-white">
                  {number(item.value)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Recent orders */}
      <Panel
        title="Recent orders"
        subtitle="The five latest orders received by your store"
        action={
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        }
      >
        {recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order, index) => {
                  const status = String(
                    order.status ?? 'UNKNOWN'
                  ).toUpperCase();

                  const customer =
                    order.customer?.username ??
                    order.customer?.name ??
                    order.customer_name ??
                    order.customer ??
                    'Customer';

                  return (
                    <tr
                      key={order.id ?? index}
                      className="border-b border-white/[0.05] last:border-0"
                    >
                      <td className="py-4 pr-4 font-semibold text-white">
                        #{order.id ?? '—'}
                      </td>

                      <td className="py-4 pr-4 text-zinc-300">
                        {typeof customer === 'object'
                          ? customer.email ?? 'Customer'
                          : customer}
                      </td>

                      <td className="py-4 pr-4 text-zinc-500">
                        {dateLabel(order.created_at)}
                      </td>

                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            statusStyle[status] ??
                            'border-white/10 bg-white/5 text-zinc-300'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-4 text-right font-semibold text-white">
                        {money(order.total_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No orders have been placed yet." />
        )}
      </Panel>

      {/* Low stock and best-selling products */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title="Low-stock alerts"
          subtitle="Products with five or fewer units"
          action={
            <AlertTriangle
              size={19}
              className="text-amber-300"
            />
          }
        >
          {lowStock.length ? (
            <div className="space-y-3">
              {lowStock.map((product, index) => {
                const stock = Number(product.stock_quantity ?? 0);

                return (
                  <div
                    key={product.id ?? index}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                      <Package size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {product.name ?? 'Unnamed product'}
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-500">
                        SKU: {product.sku || 'Not available'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          stock <= 0
                            ? 'text-red-300'
                            : 'text-amber-300'
                        }`}
                      >
                        {stock <= 0
                          ? 'Out of stock'
                          : `${number(stock)} left`}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {money(product.price)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No low-stock products found." />
          )}
        </Panel>

        <Panel
          title="Best-selling products"
          subtitle="Ranked by units sold in order items"
          action={
            <TrendingUp
              size={19}
              className="text-emerald-300"
            />
          }
        >
          {topProducts.length ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => {
                const sold = Number(product.sold ?? 0);

                const maxSold = Math.max(
                  ...topProducts.map((item) =>
                    Number(item.sold ?? 0)
                  ),
                  1
                );

                return (
                  <div
                    key={
                      product.product__id ??
                      product.id ??
                      index
                    }
                    className="flex gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-sm font-bold text-zinc-300">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {product.product__name ??
                            product.name ??
                            'Unnamed product'}
                        </p>

                        <span className="shrink-0 text-xs font-semibold text-white">
                          {number(sold)} sold
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                          style={{
                            width: `${Math.min(
                              (sold / maxSold) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Sales data will appear here when order items are available." />
          )}
        </Panel>
      </div>

      {/* Latest customers */}
      <Panel
        title="Recently registered customers"
        subtitle="The latest customer accounts"
        action={
          <Users
            size={19}
            className="text-blue-300"
          />
        }
      >
        {latestUsers.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {latestUsers.map((customer, index) => {
              const username =
                customer.username ??
                customer.first_name ??
                customer.email ??
                'Customer';

              const email = customer.email ?? '';

              return (
                <div
                  key={customer.id ?? index}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-sm font-bold text-blue-200">
                    {String(username).charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {username}
                    </p>

                    <p className="truncate text-xs text-zinc-500">
                      {email || 'No email available'}
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-600">
                      Joined {dateLabel(customer.date_joined)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState message="No customer accounts found." />
        )}
      </Panel>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5 text-xs text-zinc-600">
        <p>BabyBliss · Admin dashboard</p>

        <p className="flex items-center gap-2">
          <CheckCircle2
            size={14}
            className="text-emerald-400"
          />
          Data loaded from your Django API
        </p>
      </div>
    </div>
  );
}
