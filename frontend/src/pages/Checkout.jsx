import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  CreditCard,
  Check,
  Plus,
  ChevronRight,
  Loader,
  Tag,
  X,
} from 'lucide-react';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const steps = ['Address', 'Review', 'Payment'];

const EMPTY_ADDRESS = {
  full_name: '',
  phone_number: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
  is_default: false,
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ ...EMPTY_ADDRESS });

  const [pendingOrder, setPendingOrder] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const items = cart?.items || [];
  const subtotal = Number(cart?.subtotal ?? 0);
  const total = Number(cart?.total ?? 0);

  const orderSubtotal = Number(
    pendingOrder?.total_amount ?? total
  );

  const orderTotal = Number(
    pendingOrder?.final_amount ??
      Math.max(0, orderSubtotal - couponDiscount)
  );

  const loadAddresses = useCallback(async () => {
    try {
      const response = await api.get('/api/addresses/');
      const data = response.data?.data || response.data;

      const addressList = Array.isArray(data)
        ? data
        : data?.results || [];

      setAddresses(addressList);

      setSelectedAddress((currentAddress) => {
        const currentStillExists = addressList.some(
          (address) => address.id === currentAddress
        );

        if (currentAddress !== null && currentStillExists) {
          return currentAddress;
        }

        const defaultAddress =
          addressList.find((address) => address.is_default) ||
          addressList[0];

        return defaultAddress?.id ?? null;
      });
    } catch (error) {
      console.error('Failed to load delivery addresses:', error);
      toast.error('Could not load your saved addresses.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initializeCheckout = async () => {
      try {
        await Promise.all([fetchCart(), loadAddresses()]);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to initialize checkout:', error);
        }
      }
    };

    void initializeCheckout();

    return () => {
      cancelled = true;
    };
  }, [fetchCart, loadAddresses]);

  const handleAddAddress = async (e) => {
    e.preventDefault();

    try {
      await api.post('/api/addresses/create/', newAddress);
      await loadAddresses();

      setShowAddressForm(false);
      setNewAddress({ ...EMPTY_ADDRESS });

      toast.success('Address added!');
    } catch (error) {
      console.error('Failed to add address:', error);
      toast.error('Failed to add address');
    }
  };


  const handleContinueToReview = async () => {
  if (!selectedAddress) {
    toast.error('Please select a delivery address.');
    return;
  }

  if (items.length === 0) {
    toast.error('Your cart is empty.');
    return;
  }

  setLoading(true);

  try {
    // Reuse the order if this checkout already created one.
    if (pendingOrder?.id) {
      setStep(1);
      return;
    }

    const response = await api.post('/api/orders/create/', {
      address_id: selectedAddress,
    });

    const order = response.data?.data;

    if (!order?.id) {
      throw new Error('The server did not return a valid order.');
    }

    setPendingOrder(order);
    setCouponDiscount(Number(order.discount_amount ?? 0));
    setAppliedCoupon(order.coupon?.code ?? order.coupon_code ?? '');
    setStep(1);
  } catch (error) {
    console.error(
      'Failed to prepare checkout:',
      error.response?.data || error.message
    );

    toast.error(
      error.response?.data?.message ||
        'Could not prepare your order. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

const handleApplyCoupon = async (e) => {
  e.preventDefault();

  if (!pendingOrder?.id) {
    toast.error('Please prepare your order before applying a coupon.');
    return;
  }

  const code = couponCode.trim().toUpperCase();

  if (!code) {
    toast.error('Please enter a coupon code.');
    return;
  }

  setCouponLoading(true);

  try {
    const response = await api.post('/api/coupons/apply/', {
      order_id: pendingOrder.id,
      code,
    });

    const result = response.data?.data;

    if (!result) {
      throw new Error('The server did not return coupon details.');
    }

    setAppliedCoupon(result.coupon || code);
    setCouponDiscount(Number(result.discount ?? 0));

    setPendingOrder((previous) => ({
      ...previous,
      coupon: result.coupon || code,
      discount_amount: Number(result.discount ?? 0),
      final_amount: Number(result.final_total ?? 0),
    }));

    setCouponCode('');
    toast.success('Coupon applied successfully!');
  } catch (error) {
    console.error(
      'Failed to apply coupon:',
      error.response?.data || error.message
    );

    const data = error.response?.data;
    const message =
      data?.message ||
      data?.detail ||
      Object.values(data || {})
        .flat()
        .find((value) => typeof value === 'string') ||
      'Unable to apply this coupon.';

    toast.error(message);
  } finally {
    setCouponLoading(false);
  }
};

const handleRemoveCoupon = async () => {
  if (!pendingOrder?.id || !appliedCoupon) {
    return;
  }

  setCouponLoading(true);

  try {
    const response = await api.delete(
      `/api/coupons/remove/${pendingOrder.id}/`
    );

    const result = response.data?.data;

    setAppliedCoupon('');
    setCouponDiscount(0);

    setPendingOrder((previous) => ({
      ...previous,
      coupon: null,
      discount_amount: 0,
      final_amount: Number(
        result?.final_total ?? previous?.total_amount ?? 0
      ),
    }));

    toast.success('Coupon removed successfully.');
  } catch (error) {
    console.error(
      'Failed to remove coupon:',
      error.response?.data || error.message
    );

    toast.error(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        'Unable to remove the coupon.'
    );
  } finally {
    setCouponLoading(false);
  }
};

const handlePlaceOrder = async () => {
  if (!selectedAddress) {
    toast.error('Please select a delivery address.');
    return;
  }

  if (items.length === 0) {
    toast.error('Your cart is empty.');
    return;
  }

  setLoading(true);

  try {
    let order = pendingOrder;

    // Fallback if the order was not prepared earlier.
    if (!order?.id) {
      const orderResponse = await api.post('/api/orders/create/', {
        address_id: selectedAddress,
      });

      order = orderResponse.data?.data;

      if (!order?.id) {
        throw new Error('The server did not return a valid order.');
      }

      setPendingOrder(order);
    }

    const paymentResponse = await api.post('/api/payments/create/', {
      order_id: order.id,
      payment_method: paymentMethod,
    });

    const paymentData = paymentResponse.data?.data;

    if (paymentMethod === 'STRIPE') {
      if (!paymentData?.checkout_url) {
        throw new Error('The Stripe checkout URL is missing.');
      }

      window.location.assign(paymentData.checkout_url);
      return;
    }

    if (paymentMethod === 'COD') {
      toast.success('Order placed successfully!');

      navigate('/order-success', {
        state: {
          order: {
            ...order,
            discount_amount: couponDiscount,
            final_amount:
              order.final_amount ??
              order.total_amount - couponDiscount,
          },
        },
      });

      return;
    }

    throw new Error('Unsupported payment method.');
  } catch (error) {
    console.error(
      'Failed to place order:',
      error.response?.data || error.message
    );

    const data = error.response?.data;
    const message =
      data?.message ||
      data?.detail ||
      Object.values(data || {})
        .flat()
        .find((value) => typeof value === 'string') ||
      error.message ||
      'Unable to complete checkout.';

    toast.error(message);
  } finally {
    setLoading(false);
  }
};


  return (
    <PageTransition>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl font-bold text-white mb-8">
          Checkout
        </h1>

        {/* Step indicator */}
        <div className="flex items-center mb-10">
          {steps.map((stepName, index) => (
            <React.Fragment key={stepName}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    index < step
                      ? 'bg-success-500 text-white'
                      : index === step
                        ? 'bg-gradient-violet text-white shadow-glow-violet'
                        : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {index < step ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                <span
                  className={`text-sm font-medium ${
                    index === step ? 'text-white' : 'text-zinc-500'
                  }`}
                >
                  {stepName}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-4 transition-all ${
                    index < step
                      ? 'bg-success-500/50'
                      : 'bg-white/[0.06]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main checkout content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Delivery address */}
              {step === 0 && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="dark-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-violet-400" />
                      </div>

                      <h2 className="font-display text-lg font-bold text-white">
                        Delivery Address
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAddress === address.id
                              ? 'border-violet-500/50 bg-violet-500/10'
                              : 'border-white/[0.06] bg-zinc-900/50 hover:border-white/20'
                          }`}
                        >

                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  checked={selectedAddress === address.id}
                  onChange={() =>
                    setSelectedAddress(address.id)
                  }
                  disabled={Boolean(pendingOrder?.id)}
                  className="mt-1 text-violet-500 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                />


                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">
                                {address.address_line_1}
                                {address.address_line_2
                                  ? `, ${address.address_line_2}`
                                  : ''}
                              </p>

                              {address.is_default && (
                                <span className="badge-violet text-[10px]">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 mt-1">
                              {address.city}, {address.state}{' '}
                              {address.postal_code}, {address.country}
                            </p>
                          </div>
                        </label>
                      ))}

                      {!showAddressForm ? (

                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      disabled={Boolean(pendingOrder?.id)}
                      className="w-full py-4 rounded-xl border border-dashed border-white/[0.12] text-sm text-zinc-400 hover:text-white hover:border-violet-500/40 flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Address
                    </button>
                      ) : (
                        <form
                          onSubmit={handleAddAddress}
                          className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3"
                        >
                          <input
                            required
                            placeholder="Full Name"
                            value={newAddress.full_name}
                            onChange={(e) =>
                              setNewAddress((previous) => ({
                                ...previous,
                                full_name: e.target.value,
                              }))
                            }
                            className="input-dark text-sm"
                          />

                          <input
                            required
                            placeholder="Phone Number"
                            value={newAddress.phone_number}
                            onChange={(e) =>
                              setNewAddress((previous) => ({
                                ...previous,
                                phone_number: e.target.value,
                              }))
                            }
                            className="input-dark text-sm"
                          />

                          <input
                            required
                            placeholder="Address Line 1"
                            value={newAddress.address_line_1}
                            onChange={(e) =>
                              setNewAddress((previous) => ({
                                ...previous,
                                address_line_1: e.target.value,
                              }))
                            }
                            className="input-dark text-sm"
                          />

                          <input
                            placeholder="Address Line 2 (optional)"
                            value={newAddress.address_line_2}
                            onChange={(e) =>
                              setNewAddress((previous) => ({
                                ...previous,
                                address_line_2: e.target.value,
                              }))
                            }
                            className="input-dark text-sm"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <input
                              required
                              placeholder="City"
                              value={newAddress.city}
                              onChange={(e) =>
                                setNewAddress((previous) => ({
                                  ...previous,
                                  city: e.target.value,
                                }))
                              }
                              className="input-dark text-sm"
                            />

                            <input
                              required
                              placeholder="State"
                              value={newAddress.state}
                              onChange={(e) =>
                                setNewAddress((previous) => ({
                                  ...previous,
                                  state: e.target.value,
                                }))
                              }
                              className="input-dark text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <input
                              required
                              placeholder="Postal Code"
                              value={newAddress.postal_code}
                              onChange={(e) =>
                                setNewAddress((previous) => ({
                                  ...previous,
                                  postal_code: e.target.value,
                                }))
                              }
                              className="input-dark text-sm"
                            />

                            <input
                              required
                              placeholder="Country"
                              value={newAddress.country}
                              onChange={(e) =>
                                setNewAddress((previous) => ({
                                  ...previous,
                                  country: e.target.value,
                                }))
                              }
                              className="input-dark text-sm"
                            />
                          </div>

                          <div className="flex gap-3">
                           <button
                              type="submit"
                              disabled={Boolean(pendingOrder?.id)}
                              className="btn-primary text-sm py-2 px-4 flex-1 disabled:opacity-50"
                            >
                              Save Address
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowAddressForm(false)}
                              className="btn-ghost text-sm py-2 px-4"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleContinueToReview}
                      disabled={!selectedAddress}
                      className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      Continue to Review
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Review order */}
              {step === 1 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="dark-card p-6">
                    <h2 className="font-display text-lg font-bold text-white mb-4">
                      Review Your Order
                    </h2>

                    <div className="space-y-3">
                      {items.map((item) => {
                        const product = item.product || {};

                        const images = Array.isArray(product.images)
                          ? product.images
                          : [];

                        const firstImage = images[0];

                        const rawImageUrl =
                          typeof firstImage === 'string'
                            ? firstImage
                            : firstImage?.image ||
                              firstImage?.image_url ||
                              firstImage?.url ||
                              null;

                        const imageUrl = rawImageUrl
                          ? rawImageUrl.startsWith('http')
                            ? rawImageUrl
                            : `${
                                import.meta.env.VITE_API_URL ||
                                'http://127.0.0.1'
                              }${
                                rawImageUrl.startsWith('/') ? '' : '/'
                              }${rawImageUrl}`
                          : null;

                        const price = Number(
                          item.final_price ??
                            product.final_price ??
                            item.unit_price ??
                            product.price ??
                            0
                        );

                        const quantity = Number(item.quantity ?? 1);
                        const itemTotal = price * quantity;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0"
                          >
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex-shrink-0 overflow-hidden">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name || 'Product'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {product.name || 'Product'}
                              </p>

                              <p className="text-xs text-zinc-500 mt-1">
                                ₹{price.toFixed(2)} × {quantity}
                              </p>
                            </div>

                            <span className="text-sm font-bold text-white">
                              ₹{itemTotal.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>


{/* Coupon section */}
<div className="mt-6 border-t border-white/[0.06] pt-5">
  <div className="flex items-center gap-2 mb-3">
    <Tag className="w-5 h-5 text-violet-400" />
    <h3 className="text-sm font-semibold text-white">
      Apply Coupon
    </h3>
  </div>

  {appliedCoupon ? (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div>
        <p className="text-sm font-semibold text-emerald-400">
          {appliedCoupon}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          You saved ₹{couponDiscount.toFixed(2)}
        </p>
      </div>

      <button
        type="button"
        onClick={handleRemoveCoupon}
        disabled={couponLoading}
        className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
      >
        <X className="h-4 w-4" />
        Remove
      </button>
    </div>
  ) : (
    <form
      onSubmit={handleApplyCoupon}
      className="flex gap-2"
    >
      <input
        type="text"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        placeholder="Enter coupon code"
        maxLength={50}
        disabled={couponLoading}
        className="input-dark min-w-0 flex-1 text-sm uppercase"
        aria-label="Coupon code"
      />

      <button
        type="submit"
        disabled={couponLoading || !couponCode.trim()}
        className="btn-primary px-5 text-sm disabled:opacity-50"
      >
        {couponLoading ? 'Applying...' : 'Apply'}
      </button>
    </form>
  )}
</div>


                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="btn-ghost flex-1 text-sm"
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                      >
                        Continue to Payment
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="dark-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-pink-400" />
                      </div>

                      <h2 className="font-display text-lg font-bold text-white">
                        Payment
                      </h2>
                    </div>

                    <div className="space-y-4 mb-6">
                      <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="STRIPE"
                          checked={paymentMethod === 'STRIPE'}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value)
                          }
                        />

                        <div>
                          <p className="text-white font-medium">Stripe</p>
                          <p className="text-zinc-400 text-sm">
                            Pay securely using Card
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="COD"
                          checked={paymentMethod === 'COD'}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value)
                          }
                        />

                        <div>
                          <p className="text-white font-medium">
                            Cash on Delivery
                          </p>
                          <p className="text-zinc-400 text-sm">
                            Pay when your order arrives
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn-ghost flex-1 text-sm"
                      >
                        Back
                      </button>

                      <motion.button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          'Place Order'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order summary */}

<div className="space-y-3 text-sm text-zinc-400">
  <div className="flex justify-between">
    <span>{items.length} items</span>
    <span className="text-white">
      ₹{orderSubtotal.toFixed(2)}
    </span>
  </div>

  {appliedCoupon && (
    <div className="flex justify-between gap-3">
      <span>
        Coupon ({appliedCoupon})
      </span>
      <span className="text-emerald-400">
        −₹{couponDiscount.toFixed(2)}
      </span>
    </div>
  )}
</div>

<div className="border-t border-white/[0.06] mt-4 pt-4 flex justify-between text-white font-bold">
  <span>Total</span>
  <span>₹{orderTotal.toFixed(2)}</span>
</div>


              <div className="mt-4 text-xs text-zinc-600 space-y-1">
                <p>✓ Secure checkout</p>
                <p>✓ 30-day free returns</p>
                <p>✓ SSL encrypted</p>
              </div>
            </div>

      </main>
    </PageTransition>
  );
}