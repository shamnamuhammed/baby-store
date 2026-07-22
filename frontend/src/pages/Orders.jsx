import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/EmptyState';
import { OrderStatusBadge } from '../components/Badge';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/orders/');
        const data = res.data?.data || res.data;
        setOrders(Array.isArray(data) ? data : data?.results || []);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl font-bold text-white mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            type="orders"
            title="No orders yet"
            description="When you place orders, they will appear here."
            action={<Link to="/products" className="btn-primary inline-flex items-center px-6 py-3">Start Shopping</Link>}
          />
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block dark-card p-5 hover:border-violet-500/40 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-zinc-400">Order #{order.id}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-violet-400 font-medium">
                    View Details <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </PageTransition>
  );
}
