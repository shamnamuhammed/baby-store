
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1"
).replace(/\/+$/, "");

const PAYMENTS_API = `${API_BASE_URL}/api/admin/payments/`;
const REFUNDS_API = `${PAYMENTS_API}refunds/`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Attach Django's CSRF token to unsafe requests.
api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrftoken="))
    ?.split("=")
    .slice(1)
    .join("=");

  const method = (config.method || "get").toLowerCase();

  if (
    csrfToken &&
    ["post", "put", "patch", "delete"].includes(method)
  ) {
    config.headers.set
      ? config.headers.set(
          "X-CSRFToken",
          decodeURIComponent(csrfToken)
        )
      : (config.headers["X-CSRFToken"] =
          decodeURIComponent(csrfToken));
  }

  return config;
});

const PAYMENT_STATUSES = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUND_REQUESTED",
  "REFUNDED",
];

const PAYMENT_METHODS = ["COD", "STRIPE", "RAZORPAY"];

const statusStyles = {
  SUCCESS: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  REFUNDED: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  REFUND_REQUESTED:
    "border-amber-500/20 bg-amber-500/10 text-amber-400",
  PENDING: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  FAILED: "border-rose-500/20 bg-rose-500/10 text-rose-400",
};

function unwrapData(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getListPayload(response) {
  const payload = unwrapData(response);

  if (Array.isArray(payload)) {
    return {
      results: payload,
      count: payload.length,
      currentPage: 1,
      totalPages: 1,
    };
  }

  // Support pagination data nested inside another results object.
  const listPayload = Array.isArray(payload?.results?.results)
    ? payload.results
    : payload;

  if (Array.isArray(listPayload?.results)) {
    const count = Number(listPayload.count);
    const currentPage = Number(
      listPayload.current_page ?? listPayload.currentPage ?? 1
    );
    const totalPages = Number(
      listPayload.total_pages ??
        listPayload.totalPages ??
        listPayload.num_pages ??
        1
    );

    return {
      results: listPayload.results,
      count: Number.isFinite(count)
        ? count
        : listPayload.results.length,
      currentPage:
        Number.isFinite(currentPage) && currentPage > 0
          ? currentPage
          : 1,
      totalPages:
        Number.isFinite(totalPages) && totalPages > 0
          ? totalPages
          : 1,
    };
  }

  return {
    results: [],
    count: 0,
    currentPage: 1,
    totalPages: 1,
  };
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (error?.response?.status === 401) {
    return "Your session may have expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "Access denied. Verify your admin permissions and CSRF configuration.";
  }

  if (!error?.response) {
    return "Cannot connect to the API. Check that the backend and Docker services are running.";
  }

  return fallback;
}

function formatCurrency(amount) {
  const number = Number(amount ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanize(value) {
  if (!value) return "Unknown";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusBadge({ status }) {
  const style =
    statusStyles[status] ||
    "border-slate-600 bg-slate-800 text-slate-300";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {humanize(status)}
    </span>
  );
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
          <Icon className="h-5 w-5 text-violet-300" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
        <CreditCard className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="mt-4 font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-1.5 break-words text-sm text-slate-200">
        {children || "—"}
      </div>
    </div>
  );
}

function PaymentDetailsModal({ item, onClose, isRefund }) {
  if (!item) return null;

  const customer =
    item.customer_name ||
    item.customer ||
    item.customer_email ||
    "Customer";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-details-title"
        className="my-auto w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-800 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              {isRefund ? "Refund information" : "Payment information"}
            </p>
            <h2
              id="payment-details-title"
              className="mt-2 text-xl font-bold text-white"
            >
              {isRefund ? "Refund" : "Payment"} #{item.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Customer">{customer}</Field>
          <Field label="Email">{item.customer_email}</Field>
          <Field label="Order ID">
            {item.order_id ? `#${item.order_id}` : "—"}
          </Field>
          <Field label="Amount">{formatCurrency(item.amount)}</Field>
          <Field label="Payment method">
            {humanize(item.payment_method)}
          </Field>
          <Field label="Status">
            <StatusBadge status={item.status} />
          </Field>
          <Field label="Transaction ID">{item.transaction_id}</Field>
          <Field label="Refunded amount">
            {formatCurrency(item.refunded_amount)}
          </Field>
          <Field label="Created">{formatDate(item.created_at)}</Field>
          <Field label="Paid at">{formatDate(item.paid_at)}</Field>
          <Field label="Refunded at">{formatDate(item.refunded_at)}</Field>

          {item.refund_reason && (
            <div className="sm:col-span-2">
              <Field label="Customer refund reason">
                {item.refund_reason}
              </Field>
            </div>
          )}

          {item.rejection_reason && (
            <div className="sm:col-span-2">
              <Field label="Refund rejection reason">
                {item.rejection_reason}
              </Field>
            </div>
          )}

          {item.failure_reason && (
            <div className="sm:col-span-2">
              <Field label="Payment failure reason">
                {item.failure_reason}
              </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-800 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectRefundModal({ onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");

  const submit = (event) => {
    event.preventDefault();

    const trimmed = reason.trim();

    if (!trimmed) {
      setValidationError(
        "Please enter a reason for rejecting this refund."
      );
      return;
    }

    if (trimmed.length > 500) {
      setValidationError(
        "The reason must be 500 characters or fewer."
      );
      return;
    }

    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-rose-500/10 p-3">
            <XCircle className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Reject refund</h2>
            <p className="mt-1 text-sm text-slate-400">
              Explain why this request is being rejected.
            </p>
          </div>
        </div>

        <label
          htmlFor="refund-rejection-reason"
          className="mt-5 block text-sm font-medium text-slate-300"
        >
          Rejection reason
        </label>

        <textarea
          id="refund-rejection-reason"
          rows={4}
          maxLength={500}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setValidationError("");
          }}
          placeholder="Enter the reason..."
          className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />

        <div className="mt-1 flex justify-between gap-2 text-xs text-slate-500">
          <span>
            {validationError || "Required · Maximum 500 characters"}
          </span>
          <span>{reason.length}/500</span>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Reject refund
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState("payments");

  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [paymentCount, setPaymentCount] = useState(0);
  const [refundCount, setRefundCount] = useState(0);
  const [paymentPages, setPaymentPages] = useState(1);
  const [refundPages, setRefundPages] = useState(1);

  const [paymentPage, setPaymentPage] = useState(1);
  const [refundPage, setRefundPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [rejectingRefund, setRejectingRefund] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce the search input.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();

      if (nextSearch !== search) {
        setLoading(true);
        setSearch(nextSearch);
        setPaymentPage(1);
        setRefundPage(1);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  // Fetch the active list. The cleanup prevents stale requests from
  // updating the UI after filters, pages, tabs, or component state change.
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setError("");

      try {
        const isPaymentsTab = activeTab === "payments";
        const endpoint = isPaymentsTab ? PAYMENTS_API : REFUNDS_API;
        const page = isPaymentsTab ? paymentPage : refundPage;

        const params = {
          page,
          page_size: 10,
          ...(search ? { search } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(isPaymentsTab && methodFilter
            ? { payment_method: methodFilter }
            : {}),
          ordering: "-created_at",
        };

        const response = await api.get(endpoint, { params });

        if (cancelled) return;

        const result = getListPayload(response);

        if (isPaymentsTab) {
          setPayments(result.results);
          setPaymentCount(result.count);
          setPaymentPages(result.totalPages);

          // A deleted or filtered record can make the current page invalid.
          if (page > result.totalPages && result.totalPages > 0) {
            setPaymentPage(result.totalPages);
          }
        } else {
          setRefunds(result.results);
          setRefundCount(result.count);
          setRefundPages(result.totalPages);

          if (page > result.totalPages && result.totalPages > 0) {
            setRefundPage(result.totalPages);
          }
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Admin payments request failed:", err);

        setError(
          getErrorMessage(
            err,
            "Could not load payment data. Check the API connection and try again."
          )
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Deferring the request avoids synchronous state updates in the effect.
    const requestTimer = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(requestTimer);
    };
  }, [
    activeTab,
    paymentPage,
    refundPage,
    search,
    statusFilter,
    methodFilter,
    refreshKey,
  ]);

  const refreshData = () => {
    setLoading(true);
    setError("");
    setRefreshKey((value) => value + 1);
  };

  const switchTab = (tab) => {
    if (tab === activeTab) return;

    setLoading(true);
    setActiveTab(tab);
    setError("");
    setNotice("");
    setStatusFilter("");
    setMethodFilter("");
    setPaymentPage(1);
    setRefundPage(1);
    setSearchInput("");
    setSearch("");
    setSelectedPayment(null);
    setSelectedRefund(null);
    setRejectingRefund(null);
  };

  const viewPayment = async (item, isRefund) => {
    setError("");

    try {
      const url = isRefund
        ? `${REFUNDS_API}${item.id}/`
        : `${PAYMENTS_API}${item.id}/`;

      const response = await api.get(url);
      const detail = unwrapData(response);

      if (isRefund) {
        setSelectedRefund(detail);
      } else {
        setSelectedPayment(detail);
      }
    } catch (err) {
      console.error("Could not load payment details:", err);

      setError(
        getErrorMessage(
          err,
          "Could not load the details. Please try again."
        )
      );
    }
  };

  const approveRefund = async (refund) => {
    const confirmed = window.confirm(
      `Approve refund for payment #${refund.id} (${formatCurrency(refund.amount)})?`
    );

    if (!confirmed) return;

    setActionBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `${REFUNDS_API}${refund.id}/approve/`
      );

      setNotice(
        response.data?.message ||
          `Refund #${refund.id} approved successfully.`
      );

      setSelectedRefund(null);
      setLoading(true);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      console.error("Refund approval failed:", err);

      setError(
        getErrorMessage(
          err,
          "Could not approve the refund. Please check its current status."
        )
      );
    } finally {
      setActionBusy(false);
    }
  };

  const rejectRefund = async (reason) => {
    if (!rejectingRefund) return;

    setActionBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `${REFUNDS_API}${rejectingRefund.id}/reject/`,
        { reason }
      );

      setNotice(
        response.data?.message ||
          `Refund #${rejectingRefund.id} rejected successfully.`
      );

      setRejectingRefund(null);
      setSelectedRefund(null);
      setLoading(true);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      console.error("Refund rejection failed:", err);

      setError(
        getErrorMessage(
          err,
          "Could not reject the refund. Please check its current status."
        )
      );
    } finally {
      setActionBusy(false);
    }
  };

  const currentRows = activeTab === "payments" ? payments : refunds;
  const currentPage = activeTab === "payments" ? paymentPage : refundPage;
  const totalPages = activeTab === "payments" ? paymentPages : refundPages;
  const totalCount = activeTab === "payments" ? paymentCount : refundCount;

  const setCurrentPage = (page) => {
    const safePage = Math.max(1, Math.min(page, totalPages));

    if (safePage === currentPage) return;

    setLoading(true);

    if (activeTab === "payments") {
      setPaymentPage(safePage);
    } else {
      setRefundPage(safePage);
    }
  };

  const clearFilters = () => {
    setLoading(true);
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setMethodFilter("");
    setPaymentPage(1);
    setRefundPage(1);
  };

  const paymentSuccessCount = payments.filter(
    (payment) => payment.status === "SUCCESS"
  ).length;

  const pendingRefundCount = refunds.filter(
    (refund) => refund.status === "REFUND_REQUESTED"
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CreditCard className="h-4 w-4 text-violet-400" />
              <span>Admin</span>
              <span className="text-slate-700">/</span>
              <span>Payments</span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Payments &amp; Refunds
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Monitor transactions, review refund requests, and manage
              payment issues from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={loading || actionBusy}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-violet-500/50 hover:bg-slate-800 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Payments matching filters"
            value={paymentCount.toLocaleString("en-IN")}
            description="Total payment records matching your filters"
            icon={CreditCard}
          />

          <SummaryCard
            title="Successful on this page"
            value={paymentSuccessCount}
            description="Successful transactions currently loaded"
            icon={ShieldCheck}
          />

          <SummaryCard
            title="Refund records"
            value={refundCount.toLocaleString("en-IN")}
            description="Refund records matching your filters"
            icon={ArrowDownLeft}
          />

          <SummaryCard
            title="Requests awaiting review"
            value={pendingRefundCount}
            description="Pending refund requests on the loaded page"
            icon={Clock}
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800">
          <button
            type="button"
            onClick={() => switchTab("payments")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === "payments"
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            All payments
          </button>

          <button
            type="button"
            onClick={() => switchTab("refunds")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === "refunds"
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Refunds

            {pendingRefundCount > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                {pendingRefundCount}
              </span>
            )}
          </button>
        </div>

        {/* Success message */}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="flex-1">{notice}</p>

            <button
              type="button"
              aria-label="Dismiss success message"
              onClick={() => setNotice("")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="flex-1 break-words">{error}</p>

            <button
              type="button"
              aria-label="Dismiss error message"
              onClick={() => setError("")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="payment-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Search
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3.5 transition focus-within:border-violet-500">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />

                <input
                  id="payment-search"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setLoading(true);
                  }}
                  placeholder={
                    activeTab === "payments"
                      ? "Transaction ID, customer name, email..."
                      : "Search customer username..."
                  }
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setLoading(true);
                    }}
                    aria-label="Clear search"
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-full xl:w-56">
              <label
                htmlFor="payment-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Status
              </label>

              <div className="relative">
                <select
                  id="payment-status"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPaymentPage(1);
                    setRefundPage(1);
                    setLoading(true);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 pr-10 text-sm text-slate-200 outline-none focus:border-violet-500"
                >
                  <option value="">All statuses</option>

                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {humanize(status)}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            {activeTab === "payments" && (
              <div className="w-full xl:w-48">
                <label
                  htmlFor="payment-method"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Payment method
                </label>

                <div className="relative">
                  <select
                    id="payment-method"
                    value={methodFilter}
                    onChange={(event) => {
                      setMethodFilter(event.target.value);
                      setPaymentPage(1);
                      setLoading(true);
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 pr-10 text-sm text-slate-200 outline-none focus:border-violet-500"
                  >
                    <option value="">All methods</option>

                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {humanize(method)}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Clear filters
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Activity className="h-3.5 w-3.5" />
            {totalCount.toLocaleString("en-IN")} matching record
            {totalCount === 1 ? "" : "s"}
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-col gap-2 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-white">
                {activeTab === "payments"
                  ? "Payment transactions"
                  : "Refund requests"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing up to 10 records per page
              </p>
            </div>

            <span className="text-xs text-slate-500">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <LoaderCircle className="h-8 w-8 animate-spin text-violet-400" />
              <p className="text-sm text-slate-400">
                Loading payment data...
              </p>
            </div>
          ) : currentRows.length === 0 ? (
            <EmptyState
              title={
                error
                  ? "Payment data unavailable"
                  : activeTab === "payments"
                    ? "No payments found"
                    : "No refunds found"
              }
              description={
                error
                  ? "Resolve the API error above, then refresh the page."
                  : "Try changing the search text or filters. New records will appear here when returned by the backend."
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        {activeTab === "payments" ? "Payment" : "Refund"}
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Customer
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Amount
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Method
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Created
                      </th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/80">
                    {currentRows.map((item) => {
                      const isRefund = activeTab === "refunds";

                      const customer =
                        item.customer_name ||
                        item.customer ||
                        item.customer_email ||
                        "Customer";

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-800/30"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">
                              #{item.id}
                            </p>

                            <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                              {item.transaction_id || "No transaction ID"}
                            </p>

                            {item.order_id && (
                              <p className="mt-1 text-xs text-slate-500">
                                Order #{item.order_id}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-200">
                              {customer}
                            </p>

                            {item.customer_email && (
                              <p className="mt-1 max-w-56 truncate text-xs text-slate-500">
                                {item.customer_email}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">
                              {formatCurrency(item.amount)}
                            </p>

                            {isRefund &&
                              Number(item.refunded_amount) > 0 && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Refunded:{" "}
                                  {formatCurrency(item.refunded_amount)}
                                </p>
                              )}
                          </td>

                          <td className="px-5 py-4 text-slate-300">
                            {humanize(item.payment_method)}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={item.status} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                            {formatDate(item.created_at)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => viewPayment(item, isRefund)}
                                title="View details"
                                aria-label={`View ${
                                  isRefund ? "refund" : "payment"
                                } ${item.id}`}
                                className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {isRefund &&
                                item.status === "REFUND_REQUESTED" && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={actionBusy}
                                      onClick={() => approveRefund(item)}
                                      title="Approve refund"
                                      aria-label={`Approve refund ${item.id}`}
                                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>

                                    <button
                                      type="button"
                                      disabled={actionBusy}
                                      onClick={() =>
                                        setRejectingRefund(item)
                                      }
                                      title="Reject refund"
                                      aria-label={`Reject refund ${item.id}`}
                                      className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Page {currentPage} of {Math.max(totalPages, 1)} ·{" "}
                  {totalCount.toLocaleString("en-IN")} total records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      loading ||
                      currentPage >= Math.max(totalPages, 1)
                    }
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Security note */}
        <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
          <p>
            Payment and refund actions are processed by your Django admin
            endpoints. The backend remains responsible for admin
            permissions, validation, and payment gateway operations.
          </p>
        </div>
      </div>

      <PaymentDetailsModal
        item={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        isRefund={false}
      />

      <PaymentDetailsModal
        item={selectedRefund}
        onClose={() => setSelectedRefund(null)}
        isRefund
      />

      {rejectingRefund && (
        <RejectRefundModal
          onClose={() => setRejectingRefund(null)}
          onConfirm={rejectRefund}
          busy={actionBusy}
        />
      )}
    </div>
  );
}
