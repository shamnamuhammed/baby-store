import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, XCircle } from 'lucide-react';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import { OrderStatusBadge } from '../components/Badge';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/orders/${id}/`);
        setOrder(res.data?.data || res.data);
      } catch {
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.patch(`/api/orders/${id}/cancel/`);
      toast.success('Order cancelled');
      const res = await api.get(`/api/orders/${id}/`);
      setOrder(res.data?.data || res.data);
    }catch (err) {
        console.log(err.response);
        console.log(err.response?.data);

        toast.error(
          err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Failed to cancel order"
        );
      }finally {
      setCancelling(false);
    }
  };

  if (loading) return <><Navbar /><div className="p-20 text-center text-white">Loading...</div></>;
  if (!order) return null;

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/orders" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Order #{order.id}</h1>
            <p className="text-sm text-zinc-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="dark-card p-6">
              <h2 className="font-display font-semibold text-white mb-4">Items</h2>
              <div className="space-y-4">
                {(order.items || []).map(item => (
                  <div key={item.id} className="flex items-center gap-4 border-b border-white/[0.04] pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-16 rounded-xl bg-zinc-900 flex items-center justify-center overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0].image} className="w-full h-full object-cover" alt="" />
                      ) : <Package className="w-6 h-6 text-zinc-700" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{item.product_name}</p>
                      <p className="text-xs text-zinc-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-white">₹{parseFloat(item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.status?.toLowerCase() === 'pending' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3.5 rounded-xl border border-error-500/30 text-error-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-error-500/10 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Cancel Order
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="dark-card p-6">
              <h3 className="font-display font-semibold text-white mb-4">Summary</h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-white">₹{parseFloat(order.total_amount).toFixed(2)}</span></div>
              </div>
              <div className="border-t border-white/[0.06] mt-4 pt-4 flex justify-between text-white font-bold">
                <span>Total</span><span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="dark-card p-6">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-400" /> Delivery Address
              </h3>
              <div className="text-sm text-zinc-400">
                {order.shipping_address ? (
                  <>
                    <p className="text-white mb-1">{order.shipping_address.address_line1}</p>
                    {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                    <p>{order.shipping_address.country}</p>
                  </>
                ) : <p>No address provided.</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </PageTransition>
  );
}
