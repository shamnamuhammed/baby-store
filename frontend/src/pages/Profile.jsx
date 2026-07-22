import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import InputField from '../components/InputField';
import LoadingButton from '../components/LoadingButton';
import FormError from '../components/FormError';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
  });

  const handleChange = (e) => setFormData(p => ({...p, [e.target.name]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.put('/api/users/me/', formData);
      toast.success('Profile updated successfully');
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl font-bold text-white mb-8">My Profile</h1>
        
        <div className="dark-card p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-violet flex items-center justify-center text-2xl font-bold text-white shadow-glow-violet">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-zinc-400">{user?.email}</p>
            </div>
          </div>

          <FormError message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField
                id="first_name" name="first_name" label="First Name"
                value={formData.first_name} onChange={handleChange} required
              />
              <InputField
                id="last_name" name="last_name" label="Last Name"
                value={formData.last_name} onChange={handleChange} required
              />
            </div>
            <InputField
              id="phone_number" name="phone_number" label="Phone Number"
              value={formData.phone_number} onChange={handleChange}
            />
            <InputField
              id="email" label="Email Address"
              value={user?.email || ''} disabled
              helpText="Email address cannot be changed."
            />
            <div className="pt-4">
              <LoadingButton loading={loading}>Save Changes</LoadingButton>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </PageTransition>
  );
}
