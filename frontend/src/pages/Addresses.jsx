import React, { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name:"",
    phone_number:"",
    address_line_1: '', 
    address_line_2: '',
     city: '',
      state: '', 
     postal_code: '',
      country: '',
       is_default: false
  });

  const loadAddresses = async () => {
    try {
      const res = await api.get('/api/addresses/');
      const data = res.data?.data || res.data;
      setAddresses(Array.isArray(data) ? data : data?.results || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAddresses(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/api/addresses/${id}/delete/`);
      toast.success('Address deleted');
      loadAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/addresses/create/', formData);
      toast.success('Address added');
      setShowForm(false);
      setFormData({
         full_name:"",
    phone_number:"",
    address_line_1: '',
    address_line_2: '', 
    city: '',
    state: '', 
    postal_code: '', 
    country: 'US',
     is_default: false });
      loadAddresses();
    } catch {
      toast.error('Failed to add address');
    }
  };

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-white">My Addresses</h1>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary py-2.5 px-4 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="dark-card p-6 mb-8 space-y-4">
            <h2 className="font-display font-semibold text-white mb-4">Add New Address</h2>
            <div className="space-y-4">
              <input
    placeholder="Full Name"
    value={formData.full_name}
    onChange={(e)=>setFormData({
        ...formData,
        full_name:e.target.value
    })}
    className="input-dark"
/>

<input
    placeholder="Phone Number"
    value={formData.phone_number}
    onChange={(e)=>setFormData({
        ...formData,
        phone_number:e.target.value
    })}
    className="input-dark"
/>
              <input required placeholder="Address Line 1" value={formData.address_line_1} onChange={e => setFormData({...formData, address_line_1: e.target.value})} className="input-dark text-sm" />
              <input placeholder="Address Line 2 (optional)" value={formData.address_line_2} onChange={e => setFormData({...formData, address_line_2: e.target.value})} className="input-dark text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="input-dark text-sm" />
                <input required placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="input-dark text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Postal Code" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} className="input-dark text-sm" />
                <input required placeholder="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="input-dark text-sm" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="rounded bg-zinc-900 border-zinc-700 text-violet-500" />
                <span className="text-sm text-zinc-400">Set as default address</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-primary text-sm px-6">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm px-6">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="skeleton h-24 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(addr => (
              <div key={addr.id} className="dark-card p-5 relative group">
                {addr.is_default && <span className="absolute top-4 right-4 badge-violet text-[10px]">Default</span>}
                <div className="flex gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{addr.address_line_1}</p>
                    {addr.address_line_2 && <p className="text-zinc-400 text-sm mt-0.5">{addr.address_line_2}</p>}
                    <p className="text-zinc-400 text-sm mt-0.5">{addr.city}, {addr.state} {addr.postal_code}</p>
                    <p className="text-zinc-400 text-sm mt-0.5">{addr.country}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.04] flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDelete(addr.id)} className="text-xs text-error-400 hover:text-error-300 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </PageTransition>
  );
}
