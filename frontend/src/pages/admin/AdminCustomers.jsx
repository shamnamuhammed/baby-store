
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Ban,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  LoaderCircle,
  UserCheck,
  UserX,
  Filter,
  BadgeCheck,
} from 'lucide-react';
import api from '../../utils/axios';

const PAGE_SIZE = 10;
const CUSTOMERS_ENDPOINT = '/api/admin/users/';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const getErrorMessage = (error, fallback = 'Something went wrong.') => {
  const data = error?.response?.data;

  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data === 'string') return data;

  if (data && typeof data === 'object') {
    const messages = Object.entries(data)
      .filter(([key]) => !['success', 'message', 'detail'].includes(key))
      .flatMap(([, value]) => {
        if (typeof value === 'string') return [value];
        if (Array.isArray(value)) {
          return value.filter((item) => typeof item === 'string');
        }
        return [];
      });

    if (messages.length) return messages.join(' ');
  }

  if (error?.response?.status === 400) {
    return 'The submitted information is invalid.';
  }
  if (error?.response?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (error?.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (error?.response?.status === 404) {
    return 'The requested customer could not be found.';
  }
  if (error?.response?.status === 409) {
    return 'This action conflicts with the current customer state.';
  }
  if (!error?.response) {
    return 'Unable to connect to the server. Check your backend connection.';
  }

  return error?.message || fallback;
};

const getFullName = (customer) => {
  if (customer?.full_name?.trim()) return customer.full_name.trim();

  const name = [customer?.first_name, customer?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || customer?.username || 'Unnamed customer';
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getInitials = (customer) =>
  getFullName(customer)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

const unwrapResponse = (responseData) => {
  if (
    responseData &&
    typeof responseData === 'object' &&
    !Array.isArray(responseData) &&
    responseData.data !== undefined
  ) {
    return responseData.data;
  }

  return responseData;
};

const normalizeListResponse = (responseData) => {
  const payload = unwrapResponse(responseData);

  if (Array.isArray(payload)) {
    return {
      results: payload,
      count: payload.length,
      totalPages: Math.max(1, Math.ceil(payload.length / PAGE_SIZE)),
    };
  }

  const results = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.users)
      ? payload.users
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  const parsedCount = Number(payload?.count);
  const count =
    payload?.count !== undefined &&
    Number.isFinite(parsedCount) &&
    parsedCount >= 0
      ? parsedCount
      : results.length;

  const parsedPageSize = Number(
    payload?.page_size ?? payload?.pageSize ?? PAGE_SIZE
  );
  const pageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize > 0
      ? parsedPageSize
      : PAGE_SIZE;

  const parsedPages = Number(
    payload?.total_pages ?? payload?.totalPages
  );

  const totalPages =
    Number.isFinite(parsedPages) && parsedPages > 0
      ? Math.ceil(parsedPages)
      : Math.max(1, Math.ceil(count / pageSize));

  return { results, count, totalPages };
};

/* -------------------------------------------------------------------------- */
/* Avatar                                                                     */
/*                                                                            */
/* A keyed child resets its local image-error state when the image URL changes.*/
/* This avoids calling setState synchronously inside an effect.                */
/* -------------------------------------------------------------------------- */

function AvatarImage({ customer, size = 'md' }) {
  const imageUrl = customer?.profile_image;

  return (
    <AvatarContent
      key={imageUrl || 'no-profile-image'}
      customer={customer}
      imageUrl={imageUrl}
      size={size}
    />
  );
}

function AvatarContent({ customer, imageUrl, size }) {
  const [imageFailed, setImageFailed] = useState(false);

  const sizeClass =
    size === 'lg'
      ? 'h-16 w-16 text-lg'
      : size === 'sm'
        ? 'h-9 w-9 text-xs'
        : 'h-11 w-11 text-sm';

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt={getFullName(customer)}
        className={`${sizeClass} shrink-0 rounded-full border border-white/10 object-cover`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={getFullName(customer)}
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20 font-bold text-violet-200`}
    >
      {getInitials(customer)}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
          : 'border-rose-400/20 bg-rose-400/10 text-rose-300'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-400' : 'bg-rose-400'
        }`}
      />
      {active ? 'Active' : 'Blocked'}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, description, accent }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#151321] p-5 transition hover:border-violet-400/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            {Number(value || 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon = Users, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-zinc-500">
        <Icon size={25} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">{description}</p>
      {action}
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-zinc-400"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle size={30} className="animate-spin text-violet-400" />
      <p className="mt-4 text-sm">Loading customers...</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Customer details modal                                                     */
/* -------------------------------------------------------------------------- */

function CustomerDetailsModal({
  customer,
  onClose,
  onToggleStatus,
  actionLoading,
}) {
  useEffect(() => {
    if (!customer) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !actionLoading) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [customer, onClose, actionLoading]);

  if (!customer) return null;

  const details = [
    { label: 'Username', value: customer.username || '—' },
    { label: 'Email address', value: customer.email || '—' },
    { label: 'Phone number', value: customer.phone_number || '—' },
    { label: 'Gender', value: customer.gender || '—' },
    { label: 'Date of birth', value: formatDate(customer.date_of_birth) },
    {
      label: 'Registered on',
      value: formatDate(customer.created_at || customer.date_joined),
    },
    { label: 'Last updated', value: formatDate(customer.updated_at) },
  ];

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget && !actionLoading) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={handleBackdropMouseDown}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-modal-title"
          className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#171522] shadow-2xl shadow-black/40"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
            <div>
              <h2 id="customer-modal-title" className="text-base font-semibold text-white">
                Customer details
              </h2>
              <p className="mt-1 text-xs text-zinc-500">Customer ID: #{customer.id}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              aria-label="Close customer details"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            >
              <X size={19} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center">
              <AvatarImage customer={customer} size="lg" />
              <h3 className="mt-3 text-lg font-semibold text-white">
                {getFullName(customer)}
              </h3>
              <p className="mt-1 break-all text-sm text-zinc-400">
                {customer.email || 'No email address'}
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <StatusBadge active={Boolean(customer.is_active)} />
                {customer.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-xs text-blue-300">
                    <BadgeCheck size={13} /> Verified
                  </span>
                )}
                {customer.is_staff && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-xs text-violet-300">
                    <ShieldCheck size={13} /> Staff
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="mt-1 break-words text-sm font-medium text-zinc-200">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={actionLoading}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onToggleStatus(customer)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                  customer.is_active
                    ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                    : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                }`}
              >
                {actionLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : customer.is_active ? (
                  <Ban size={16} />
                ) : (
                  <UserCheck size={16} />
                )}
                {customer.is_active ? 'Block customer' : 'Unblock customer'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [actionCustomerId, setActionCustomerId] = useState(null);

  const requestSequence = useRef(0);
  const searchInputRef = useRef(null);

  /* Fetching is separated from state updates.
     This callback only requests and normalizes data. */
  const fetchCustomers = useCallback(async (page, query) => {
    const params = { page, page_size: PAGE_SIZE };

    if (query.trim()) params.search = query.trim();

    const response = await api.get(CUSTOMERS_ENDPOINT, { params });

    if (response.data?.success === false) {
      throw new Error(response.data?.message || 'Unable to load customers.');
    }

    return normalizeListResponse(response.data);
  }, []);

  /* The effect handles asynchronous results and ignores stale requests. */
  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestSequence.current;

    const runRequest = async () => {
      try {
        const normalized = await fetchCustomers(currentPage, searchTerm);

        if (cancelled || requestId !== requestSequence.current) return;

        setCustomers(normalized.results);
        setTotalCount(normalized.count);
        setTotalPages(normalized.totalPages);

        const validPage = Math.min(
          Math.max(1, currentPage),
          normalized.totalPages
        );

        if (validPage !== currentPage) {
          setCurrentPage(validPage);
        }
      } catch (requestError) {
        if (cancelled || requestId !== requestSequence.current) return;

        setCustomers([]);
        setTotalCount(0);
        setTotalPages(1);
        setError(getErrorMessage(requestError, 'Unable to load customers.'));
      } finally {
        if (!cancelled && requestId === requestSequence.current) {
          setLoading(false);
        }
      }
    };

    void runRequest();

    return () => {
      cancelled = true;
      requestSequence.current += 1;
    };
  }, [fetchCustomers, currentPage, searchTerm, reloadKey]);

  /* Search and filters */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const nextSearch = searchInput.trim();

    if (nextSearch !== searchTerm) {
      setLoading(true);
      setCurrentPage(1);
      setSearchTerm(nextSearch);
      return;
    }

    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const handleClearSearch = () => {
    const changed = Boolean(searchInput || searchTerm);

    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
    searchInputRef.current?.focus();

    if (changed) setLoading(true);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage === currentPage) return;

    setLoading(true);
    setCurrentPage(nextPage);
  };

  const handleRefresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  /* Block / unblock customer */

  const handleToggleStatus = async (customer) => {
    if (!customer?.id || actionCustomerId !== null) return;

    const nextActiveState = !customer.is_active;
    const actionDescription = nextActiveState ? 'unblock' : 'block';

    const confirmed = window.confirm(
      `Are you sure you want to ${actionDescription} ${getFullName(customer)}?`
    );

    if (!confirmed) return;

    setActionCustomerId(customer.id);
    setError('');
    setNotice('');

    try {
      const response = await api.patch(
        `${CUSTOMERS_ENDPOINT}${customer.id}/`,
        { is_active: nextActiveState }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message || 'Unable to update customer status.'
        );
      }

      const payload = unwrapResponse(response.data);
      const updatedCustomer = {
        ...customer,
        ...(payload && typeof payload === 'object' ? payload : {}),
        is_active:
          typeof payload?.is_active === 'boolean'
            ? payload.is_active
            : nextActiveState,
      };

      setCustomers((previous) =>
        previous.map((item) =>
          item.id === customer.id ? updatedCustomer : item
        )
      );

      setSelectedCustomer((previous) =>
        previous?.id === customer.id ? updatedCustomer : previous
      );

      setNotice(
        `${getFullName(customer)} has been ${
          updatedCustomer.is_active ? 'unblocked' : 'blocked'
        }.`
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, 'Unable to update customer status.')
      );
    } finally {
      setActionCustomerId(null);
    }
  };

  /* Derived values */

  const visibleCustomers = useMemo(() => {
    if (statusFilter === 'active') {
      return customers.filter((customer) => Boolean(customer.is_active));
    }

    if (statusFilter === 'blocked') {
      return customers.filter((customer) => !customer.is_active);
    }

    return customers;
  }, [customers, statusFilter]);

  const activeOnPage = customers.filter(
    (customer) => Boolean(customer.is_active)
  ).length;

  const blockedOnPage = customers.length - activeOnPage;

  const pageStart =
    totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  const clearAllFilters = () => {
    const searchChanged = Boolean(searchInput || searchTerm);

    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);

    if (searchChanged) setLoading(true);
  };

  /* Render */

  return (
    <div className="min-h-full space-y-6 bg-[#100e18] p-4 text-white sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
            <Users size={14} /> User management
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Customers
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Manage customer accounts, review profile details, and control account access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-violet-400/30 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0 text-rose-300" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-200">
                Unable to complete request
              </p>
              <p className="mt-1 break-words text-sm text-rose-200/80">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
              className="rounded-md p-1 text-rose-300 hover:bg-rose-400/10"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4"
          >
            <CheckCircle2 size={19} className="shrink-0 text-emerald-300" />
            <p className="flex-1 text-sm text-emerald-200">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice('')}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-emerald-300 hover:bg-emerald-400/10"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total customers"
          value={totalCount}
          description="Matching customer accounts"
          accent="bg-violet-400/10 text-violet-300"
        />
        <StatCard
          icon={UserCheck}
          label="Active on this page"
          value={activeOnPage}
          description="Active accounts in current results"
          accent="bg-emerald-400/10 text-emerald-300"
        />
        <StatCard
          icon={UserX}
          label="Blocked on this page"
          value={blockedOnPage}
          description="Blocked accounts in current results"
          accent="bg-rose-400/10 text-rose-300"
        />
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#151321] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, username, or email..."
                aria-label="Search customers"
                className="w-full rounded-xl border border-white/[0.09] bg-[#100e18] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60 sm:flex-none"
              >
                <Search size={16} /> Search
              </button>

              {(searchInput || searchTerm) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-3">
            <Filter size={17} className="shrink-0 text-zinc-500" />
            <label
              htmlFor="customer-status-filter"
              className="shrink-0 text-sm text-zinc-400"
            >
              Status
            </label>
            <select
              id="customer-status-filter"
              value={statusFilter}
              onChange={(event) => handleStatusFilter(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-[#100e18] px-3 py-3 text-sm text-zinc-200 outline-none focus:border-violet-400/50 sm:min-w-36"
            >
              <option value="all">All customers</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4 text-xs text-zinc-500">
          <p>
            {searchTerm ? `Search results for "${searchTerm}"` : 'Showing customer accounts'}
          </p>
          <p>
            {totalCount.toLocaleString('en-IN')} total account
            {totalCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151321]">
        <div className="flex flex-col gap-2 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">Customer directory</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Customer profiles and account status
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {PAGE_SIZE} per page
          </span>
        </div>

        {loading ? (
          <LoadingState />
        ) : visibleCustomers.length === 0 ? (
          <EmptyState
            icon={searchTerm || statusFilter !== 'all' ? Search : Users}
            title={
              searchTerm || statusFilter !== 'all'
                ? 'No matching customers'
                : 'No customers found'
            }
            description={
              searchTerm || statusFilter !== 'all'
                ? 'Try another search term or change the status filter.'
                : 'Customer accounts will appear here when available.'
            }
            action={
              searchTerm || statusFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
                >
                  Clear filters
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.015] text-xs text-zinc-500">
                    <th className="px-5 py-4 font-medium">Customer</th>
                    <th className="px-5 py-4 font-medium">Contact</th>
                    <th className="px-5 py-4 font-medium">Joined</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Verification</th>
                    <th className="px-5 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-white/[0.05] transition last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <AvatarImage customer={customer} />
                          <div className="min-w-0">
                            <p className="max-w-56 truncate text-sm font-semibold text-zinc-100">
                              {getFullName(customer)}
                            </p>
                            <p className="mt-1 max-w-56 truncate text-xs text-zinc-500">
                              @{customer.username || 'unknown'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-56 items-center gap-2 text-sm text-zinc-300">
                          <Mail size={14} className="shrink-0 text-zinc-500" />
                          <span className="truncate">{customer.email || '—'}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                          <Phone size={13} className="shrink-0" />
                          <span>{customer.phone_number || 'No phone'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <CalendarDays size={14} className="shrink-0 text-zinc-500" />
                          {formatDate(customer.created_at || customer.date_joined)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={Boolean(customer.is_active)} />
                      </td>

                      <td className="px-5 py-4">
                        {customer.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-300">
                            <ShieldCheck size={15} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                            <ShieldAlert size={15} /> Unverified
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="View customer details"
                            aria-label={`View ${getFullName(customer)}`}
                            onClick={() => setSelectedCustomer(customer)}
                            className="rounded-lg border border-white/[0.08] p-2 text-zinc-400 transition hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-violet-200"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title={customer.is_active ? 'Block customer' : 'Unblock customer'}
                            aria-label={
                              customer.is_active
                                ? `Block ${getFullName(customer)}`
                                : `Unblock ${getFullName(customer)}`
                            }
                            disabled={actionCustomerId !== null}
                            onClick={() => void handleToggleStatus(customer)}
                            className={`rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              customer.is_active
                                ? 'border-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/10'
                                : 'border-emerald-400/10 text-emerald-300 hover:border-emerald-400/30 hover:bg-emerald-400/10'
                            }`}
                          >
                            {actionCustomerId === customer.id ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : customer.is_active ? (
                              <Ban size={16} />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                Showing{' '}
                <span className="font-medium text-zinc-300">
                  {pageStart}–{pageEnd}
                </span>{' '}
                of{' '}
                <span className="font-medium text-zinc-300">{totalCount}</span>{' '}
                customers
              </p>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft size={15} /> Previous
                </button>

                <span className="whitespace-nowrap text-xs text-zinc-400">
                  Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                  <span className="font-semibold text-white">{totalPages}</span>
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-4 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <p>LilBunny · Admin customer management</p>
        <p className="flex items-center gap-2">
          <UserRound size={13} />
          Customer data from your Django API
        </p>
      </div>

      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onToggleStatus={handleToggleStatus}
          actionLoading={actionCustomerId === selectedCustomer.id}
        />
      )}
    </div>
  );
}
