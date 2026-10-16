
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Package,
  XCircle,
  Tag,
  CalendarDays,
  ShoppingBag,
  Phone,
  Star,
  Send,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import { OrderStatusBadge } from '../components/Badge';

const formatMoney = (value) => {
  const amount = Number(value ?? 0);
  return `₹${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
};

const getImageUrl = (item) => {
  const image = item?.product?.image;

  if (typeof image !== 'string' || !image.trim()) {
    return null;
  }

  const imagePath = image.trim();

  try {
    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    const baseURL = api.defaults.baseURL || window.location.origin;

    return new URL(
      imagePath,
      baseURL.endsWith('/') ? baseURL : `${baseURL}/`
    ).href;
  } catch {
    return null;
  }
};

const getAddressLines = (address) => {
  if (!address || typeof address !== 'object') {
    return [];
  }

  const cityStatePostal = [
    address.city,
    address.state,
    address.postal_code,
  ].filter(Boolean).join(', ');

  return [
    address.full_name,
    address.address_line,
    address.address_line_2,
    cityStatePostal,
    address.country,
  ].filter((line) => typeof line === 'string' && line.trim());
};

function ProductImage({ src, alt }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  return (
    <div className="w-24 h-24 rounded-2xl overflow-hidden
      bg-zinc-900 border border-white/[0.06]
      flex-shrink-0 flex items-center justify-center">
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <Package className="w-9 h-9 text-zinc-600" />
      )}
    </div>
  );
}

function ReviewForm({
  productId,
  productName,
  submitting,
  reviewed,
  onSubmit,
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (reviewed) {
    return (
      <div className="mt-4 flex items-center gap-2
        text-sm text-emerald-400">
        <CheckCircle2 className="w-4 h-4" />
        Review submitted for this product
      </div>
    );
  }

  return (
    <form
      className="mt-5 rounded-xl border border-violet-500/20
        bg-violet-500/[0.04] p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ productId, rating, comment });
      }}
    >
      <h3 className="text-sm font-semibold text-white mb-3">
        Review {productName}
      </h3>

      <label className="block text-sm text-zinc-400 mb-2">
        Your rating
      </label>

      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`Rate ${value} out of 5 stars`}
            aria-pressed={rating === value}
            onClick={() => setRating(value)}
            className="rounded-md p-1
              focus:outline-none focus-visible:ring-2
              focus-visible:ring-violet-400"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                value <= rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-zinc-600'
              }`}
            />
          </button>
        ))}

        <span className="ml-1 text-sm text-zinc-400">
          {rating}/5
        </span>
      </div>

      <label
        htmlFor={`review-comment-${productId}`}
        className="block text-sm text-zinc-400 mb-2"
      >
        Your feedback (optional)
      </label>

      <textarea
        id={`review-comment-${productId}`}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="How was this product?"
        className="w-full resize-y rounded-xl
          border border-white/10 bg-zinc-950/60
          px-3 py-3 text-sm text-white
          placeholder:text-zinc-600
          focus:outline-none focus:border-violet-500"
      />

      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center
            gap-2 rounded-xl bg-violet-600 px-4 py-2.5
            text-sm font-medium text-white
            hover:bg-violet-500 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const [submittingReviewId, setSubmittingReviewId] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState([]);

  const loadOrder = useCallback(async () => {
    const response = await api.get(`/api/orders/${id}/`);
    const data = response.data?.data ?? response.data;

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Invalid order response.');
    }

    setOrder(data);
    return data;
  }, [id]);

  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      setLoading(true);
      setOrder(null);
      setReviewedProductIds([]);

      try {
        const response = await api.get(`/api/orders/${id}/`);

        if (!active) return;

        const data = response.data?.data ?? response.data;

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Invalid order response.');
        }

        setOrder(data);
      } catch (error) {
        console.error(
          'Failed to load order:',
          error.response?.data ?? error
        );

        if (active) {
          toast.error(
            error.response?.data?.message ||
              'Unable to load order details.'
          );
          navigate('/orders');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      active = false;
    };
  }, [id, navigate]);

  const handleCancel = async () => {
    if (cancelling) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel this order?'
    );

    if (!confirmed) return;

    setCancelling(true);

    try {
      await api.patch(`/api/orders/${id}/cancel/`);
      await loadOrder();
      toast.success('Order cancelled successfully.');
    } catch (error) {
      console.error(
        'Failed to cancel order:',
        error.response?.data ?? error
      );

      toast.error(
        error.response?.data?.message ||
          'Failed to cancel order.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSubmit = async ({
    productId,
    rating,
    comment,
  }) => {
    if (submittingReviewId !== null) return;

    if (order?.status?.toUpperCase() !== 'DELIVERED') {
      toast.error('You can review products after delivery.');
      return;
    }

    if (reviewedProductIds.includes(productId)) {
      toast.error('You have already submitted a review.');
      return;
    }

    setSubmittingReviewId(productId);

    try {
      await api.post(`/api/products/${productId}/reviews/`, {
        rating,
        comment: comment.trim(),
      });

      setReviewedProductIds((previous) =>
        previous.includes(productId)
          ? previous
          : [...previous, productId]
      );

      toast.success('Your review has been submitted!');
    } catch (error) {
      console.error(
        'Failed to submit review:',
        error.response?.data ?? error
      );

      const errorData = error.response?.data;
      const message =
        errorData?.message ||
        errorData?.data?.message ||
        errorData?.detail ||
        'Unable to submit your review. Please try again.';

      const normalizedMessage = String(
        typeof message === 'string'
          ? message
          : JSON.stringify(message)
      ).toLowerCase();

      if (
        normalizedMessage.includes('already reviewed') ||
        normalizedMessage.includes('already submitted')
      ) {
        setReviewedProductIds((previous) =>
          previous.includes(productId)
            ? previous
            : [...previous, productId]
        );
      }

      toast.error(
        typeof message === 'string'
          ? message
          : 'Unable to submit your review.'
      );
    } finally {
      setSubmittingReviewId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6
          lg:px-8 py-16 min-h-[60vh]">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-48 rounded-lg bg-zinc-800" />
            <div className="h-40 rounded-2xl bg-zinc-800" />
            <div className="h-40 rounded-2xl bg-zinc-800" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-20
          text-center min-h-[60vh]">
          <Package className="w-14 h-14 text-zinc-600
            mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white">
            Order details unavailable
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            We could not find the requested order.
          </p>
          <Link
            to="/orders"
            className="inline-flex mt-6 text-violet-400
              hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to My Orders
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.total_amount ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const total = Number(order.final_amount ?? order.total_amount ?? 0);
  const address = order.shipping_address;
  const addressLines = getAddressLines(address);
  const isDelivered = order.status?.toUpperCase() === 'DELIVERED';

  return (
    <PageTransition>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6
        lg:px-8 py-10 min-h-[60vh]">

        <Link
          to="/orders"
          className="inline-flex items-center gap-2
            text-sm text-zinc-400 hover:text-violet-300
            mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row
          sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl
              sm:text-3xl font-bold text-white">
              Order #{order.id}
            </h1>
            <p className="text-sm text-zinc-400 mt-2
              flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-violet-400" />
              {order.created_at
                ? new Date(order.created_at).toLocaleString()
                : 'Date unavailable'}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="dark-card rounded-2xl p-5 sm:p-6
              border border-white/[0.06]">

              <div className="flex items-center justify-between
                gap-3 mb-6">
                <h2 className="font-display text-lg
                  font-semibold text-white
                  flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-violet-400" />
                  Order Items
                </h2>
                <span className="text-sm text-zinc-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <Package className="w-10 h-10
                    text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">
                    No products are available for this order.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {items.map((item, index) => {
                    const product = item.product ?? {};
                    const productName = product.name || 'Product';
                    const productId = product.id;
                    const imageUrl = getImageUrl(item);
                    const quantity = Number(item.quantity ?? 0);

                    const originalPrice = Number(item.unit_price ?? 0);
                    const finalUnitPrice = Number(
                      item.final_price ?? item.unit_price ?? 0
                    );

                    const storedSubtotal = Number(item.subtotal);
                    const lineTotal = Number.isFinite(storedSubtotal)
                      ? storedSubtotal
                      : finalUnitPrice * quantity;

                    const hasDiscount = originalPrice > finalUnitPrice;

                    return (
                      <motion.div
                        key={item.id ?? `${productName}-${index}`}
                        layout
                        className="pb-5 border-b border-white/[0.06]
                          last:border-0 last:pb-0"
                      >
                        <div className="flex flex-col sm:flex-row
                          sm:items-center gap-4">
                          <ProductImage src={imageUrl} alt={productName} />

                          <div className="flex-1 min-w-0">
                            {productId ? (
                              <Link
                                to={`/products/${productId}`}
                                className="text-sm sm:text-base
                                  font-semibold text-white
                                  hover:text-violet-300 transition-colors"
                              >
                                {productName}
                              </Link>
                            ) : (
                              <p className="text-sm sm:text-base
                                font-semibold text-white">
                                {productName}
                              </p>
                            )}

                            <p className="text-sm text-zinc-400 mt-2">
                              Quantity: {quantity}
                            </p>

                            <div className="flex flex-wrap
                              items-center gap-2 mt-2">
                              <span className="text-sm text-zinc-300">
                                Unit price: {formatMoney(finalUnitPrice)}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-zinc-500 line-through">
                                  {formatMoney(originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="sm:text-right flex-shrink-0">
                            <p className="text-xs text-zinc-500 mb-1">
                              Item total
                            </p>
                            <p className="text-base font-bold text-white">
                              {formatMoney(lineTotal)}
                            </p>
                          </div>
                        </div>

                        {isDelivered && productId && (
                          <ReviewForm
                            productId={productId}
                            productName={productName}
                            submitting={submittingReviewId === productId}
                            reviewed={reviewedProductIds.includes(productId)}
                            onSubmit={handleReviewSubmit}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {order.status?.toUpperCase() === 'PENDING' && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3.5 rounded-xl
                  border border-red-500/30 text-red-400
                  font-medium text-sm flex items-center
                  justify-center gap-2 hover:bg-red-500/10
                  transition-colors disabled:opacity-50
                  disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </section>

          <aside className="space-y-6">
            <section className="dark-card rounded-2xl p-6
              border border-white/[0.06]">
              <h2 className="font-display text-lg
                font-semibold text-white mb-5">
                Order Summary
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-3 text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formatMoney(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between gap-3 text-zinc-400">
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Discount
                    </span>
                    <span className="text-emerald-400">
                      −{formatMoney(discount)}
                    </span>
                  </div>
                )}

                {order.coupon_code && (
                  <div className="flex justify-between gap-3 text-zinc-400">
                    <span>Coupon</span>
                    <span className="text-violet-300 font-medium">
                      {order.coupon_code}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.08]
                mt-5 pt-5 flex justify-between items-center gap-3">
                <span className="font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-white">
                  {formatMoney(total)}
                </span>
              </div>
            </section>

            <section className="dark-card rounded-2xl p-6
              border border-white/[0.06]">
              <h2 className="font-display text-lg
                font-semibold text-white mb-5
                flex items-center gap-2">
                <MapPin className="w-5 h-5 text-violet-400" />
                Delivery Address
              </h2>

              {addressLines.length > 0 ? (
                <div className="space-y-2.5 text-sm text-zinc-400">
                  {addressLines.map((line, index) => (
                    <p
                      key={`${index}-${line}`}
                      className={index === 0 ? 'font-semibold text-white' : ''}
                    >
                      {line}
                    </p>
                  ))}

                  {address?.phone_number && (
                    <div className="flex items-center gap-2 pt-3 mt-3
                      border-t border-white/[0.06]">
                      <Phone className="w-4 h-4
                        text-violet-400 flex-shrink-0" />
                      <span className="text-zinc-300">
                        {address.phone_number}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Delivery address is not available in this order response.
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>

      <Footer />
    </PageTransition>
  );
}
