import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CreditCard, Check, Plus, ChevronRight, Loader } from 'lucide-react';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const steps = ['Address', 'Review', 'Payment'];

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("STRIPE");

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name:'',
    phone_number:'',
    address_line_1: '', 
    address_line_2: '', 
    city: '',
    state: '', 
    postal_code: '', 
    country: 'US', 
    is_default: false
  });

  useEffect(() => {
    fetchCart();
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const res = await api.get('/api/addresses/');
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : data?.results || [];
      setAddresses(list);
      const def = list.find(a => a.is_default) || list[0];
      if (def) setSelectedAddress(def.id);
    } catch {}
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/addresses/create/', newAddress);
      await loadAddresses();
      setShowAddressForm(false);
      setNewAddress({   full_name:'',
                        phone_number:'',
                        address_line_1: '',
                         address_line_2: '', 
                         city: '', state: '', 
                         postal_code: '', 
                         country: 'US',
                          is_default: false });
      toast.success('Address added!');
    } catch {
      toast.error('Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
       toast.error('Please select a delivery address'); 
      return; }

    // console.log("Selected Address:", selectedAddress);
    //   console.log("Payload:", {
    //     address_id: selectedAddress
    //   });

    setLoading(true);
    try {
      const orderRes = await api.post(
        '/api/orders/create/', { 
        address_id: selectedAddress });
      const order = orderRes.data.data;
console.log("Selected Payment Method:", paymentMethod);
      // Create Stripe Checkout Session
        const paymentRes= await api.post('/api/payments/create/', 
          { order_id: order.id, 
            payment_method: paymentMethod, }
          );


        // const checkoutUrl = paymentRes.data.data.checkout_url;

        // window.location.href =checkoutUrl;

        if (paymentMethod === "STRIPE") {

    window.location.href = paymentRes.data.data.checkout_url;

} else {

    toast.success("Order placed successfully!");
    navigate("/order-success");

}
      

      // navigate('/order-success', { state: { order } });
    } catch (err) {
      console.log(err.response?.data);
      toast.error(err.response?.data?.message || 'Payment creation failed');
    } finally {
      setLoading(false);
    }
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => {
    const p = parseFloat(i.product?.discount_price || i.product?.price || i.price || 0);
    return s + p * (i.quantity || 1);
  }, 0);

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl font-bold text-white mb-8">Checkout</h1>

        {/* Step Indicator */}
        <div className="flex items-center mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? 'bg-success-500 text-white' : i === step ? 'bg-gradient-violet text-white shadow-glow-violet' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? 'text-white' : 'text-zinc-500'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 transition-all ${i < step ? 'bg-success-500/50' : 'bg-white/[0.06]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Address */}
              {step === 0 && (
                <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="dark-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-violet-400" />
                      </div>
                      <h2 className="font-display text-lg font-bold text-white">Delivery Address</h2>
                    </div>

                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedAddress === addr.id
                            ? 'border-violet-500/50 bg-violet-500/10'
                            : 'border-white/[0.06] bg-zinc-900/50 hover:border-white/20'
                        }`}>
                          <input
                            type="radio"
                            name="address"
                            value={addr.id}
                            checked={selectedAddress === addr.id}
                            onChange={() => setSelectedAddress(addr.id)}
                            className="mt-1 text-violet-500 focus:ring-violet-500/40"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">
                                {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                              </p>
                              {addr.is_default && <span className="badge-violet text-[10px]">Default</span>}
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                              {addr.city}, {addr.state} {addr.postal_code}, {addr.country}
                            </p>
                          </div>
                        </label>
                      ))}

                      {/* Add Address */}
                      {!showAddressForm ? (
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="w-full py-4 rounded-xl border border-dashed border-white/[0.12] text-sm text-zinc-400 hover:text-white hover:border-violet-500/40 flex items-center justify-center gap-2 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Add New Address
                        </button>
                      ) : (
                        <form onSubmit={handleAddAddress} className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3">
                          <input
                            required
                            placeholder="Full Name"
                            value={newAddress.full_name}
                            onChange={(e) =>
                              setNewAddress((prev) => ({
                                ...prev,
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
                              setNewAddress((prev) => ({
                                ...prev,
                                phone_number: e.target.value,
                              }))
                            }
                            className="input-dark text-sm"
                          />
                                                    <input required placeholder="Address Line 1" value={newAddress.address_line_1}
                            onChange={e => setNewAddress(p => ({...p, address_line_1: e.target.value}))}
                            className="input-dark text-sm" />
                          <input placeholder="Address Line 2 (optional)" value={newAddress.address_line_2}
                            onChange={e => setNewAddress(p => ({...p, address_line_2: e.target.value}))}
                            className="input-dark text-sm" />
                          <div className="grid grid-cols-2 gap-3">
                            <input required placeholder="City" value={newAddress.city}
                              onChange={e => setNewAddress(p => ({...p, city: e.target.value}))}
                              className="input-dark text-sm" />
                            <input required placeholder="State" value={newAddress.state}
                              onChange={e => setNewAddress(p => ({...p, state: e.target.value}))}
                              className="input-dark text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input required placeholder="Postal Code" value={newAddress.postal_code}
                              onChange={e => setNewAddress(p => ({...p, postal_code: e.target.value}))}
                              className="input-dark text-sm" />
                            <input required placeholder="Country" value={newAddress.country}
                              onChange={e => setNewAddress(p => ({...p, country: e.target.value}))}
                              className="input-dark text-sm" />
                          </div>
                          <div className="flex gap-3">
                            <button type="submit" className="btn-primary text-sm py-2 px-4 flex-1">Save Address</button>
                            <button type="button" onClick={() => setShowAddressForm(false)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>

                    <button
                      onClick={() => setStep(1)}
                      disabled={!selectedAddress}
                      className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      Continue to Review <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Review */}
              {step === 1 && (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="dark-card p-6">
                    <h2 className="font-display text-lg font-bold text-white mb-4">Review Your Order</h2>
                    <div className="space-y-3">
                      {items.map((item) => {
                        const p = item.product || {};
                        const price = parseFloat(p.discount_price || p.price || item.price || 0);
                        return (
                          <div key={item.id} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex-shrink-0 overflow-hidden">
                              {p.images?.[0] && <img src={p.images[0].image} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{p.name}</p>
                              <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-bold text-white">₹{(price * item.quantity).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setStep(0)} className="btn-ghost flex-1 text-sm">Back</button>
                      <button onClick={() => setStep(2)} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                        Continue to Payment <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="dark-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-pink-400" />
                      </div>
                      <h2 className="font-display text-lg font-bold text-white">Payment</h2>
                    </div>

                    {/* Stripe info */}
                    {/* <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Secure Payment via Stripe</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Your payment info is encrypted and secure</p>
                        </div>
                      </div>
                    </div> */}

      <div className="space-y-4 mb-6">

          <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer">
            <input
              type="radio"
              value="STRIPE"
              checked={paymentMethod === "STRIPE"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <div>
              <p className="text-white font-medium">
                Stripe
              </p>
              <p className="text-zinc-400 text-sm">
                Pay securely using Card
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer">
            <input
              type="radio"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={(e) => setPaymentMethod(e.target.value)}
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
                      <button onClick={() => setStep(1)} className="btn-ghost flex-1 text-sm">Back</button>
                      <motion.button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                      >
                        {loading ? <><Loader className="w-4 h-4 animate-spin" /> Placing Order...</> : 'Place Order'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div>
            <div className="dark-card p-5 sticky top-24">
              <h3 className="font-display font-semibold text-white mb-4">Summary</h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <div className="flex justify-between"><span>{items.length} items</span><span className="text-white">₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className={subtotal > 50 ? 'text-success-400' : 'text-white'}>{subtotal > 50 ? 'FREE' : '₹9.99'}</span></div>
              </div>
              <div className="border-t border-white/[0.06] mt-4 pt-4 flex justify-between text-white font-bold">
                <span>Total</span>
                <span>₹{(subtotal + (subtotal > 50 ? 0 : 9.99)).toFixed(2)}</span>
              </div>
              <div className="mt-4 text-xs text-zinc-600 space-y-1">
                <p>✓ Secure checkout</p>
                <p>✓ 30-day free returns</p>
                <p>✓ SSL encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
