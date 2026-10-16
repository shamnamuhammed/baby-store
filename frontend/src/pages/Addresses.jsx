
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';

const INITIAL_FORM_DATA = {
  full_name: '',
  phone_number: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  is_default: false,
};

function getAddressList(responseData) {
  const data = responseData?.data ?? responseData;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [error, setError] = useState('');

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/addresses/');
      setAddresses(getAddressList(response.data));
    } catch (err) {
      setAddresses([]);

      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to load addresses. Please try again.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchAddresses = async () => {
      try {
        const response = await api.get('/api/addresses/');

        if (!cancelled) {
          setAddresses(getAddressList(response.data));
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setAddresses([]);

          const message =
            err.response?.data?.message ||
            err.response?.data?.detail ||
            'Failed to load addresses. Please try again.';

          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchAddresses();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) {
      return;
    }

    setDeletingId(id);

    try {
      await api.delete(`/api/addresses/${id}/delete/`);

      setAddresses((previous) =>
        previous.filter((address) => address.id !== id)
      );

      toast.success('Address deleted');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to delete address. Please try again.';

      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      const payload = {
        ...formData,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        address_line_1: formData.address_line_1.trim(),
        address_line_2: formData.address_line_2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postal_code: formData.postal_code.trim(),
        country: formData.country.trim(),
      };

      await api.post('/api/addresses/create/', payload);

      toast.success('Address added');

      resetForm();

      await loadAddresses();
    } catch (err) {
      const responseData = err.response?.data;

      const message =
        responseData?.message ||
        responseData?.detail ||
        responseData?.data?.address_line_1?.[0] ||
        responseData?.address_line_1?.[0] ||
        'Failed to add address. Please check your details.';

      toast.error(
        typeof message === 'string'
          ? message
          : 'Please check your address details and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            My Addresses
          </h1>

          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="btn-primary py-2.5 px-4 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          )}
        </div>

        {/* Address form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="dark-card p-6 mb-8 space-y-4"
          >
            <h2 className="font-display font-semibold text-white mb-4">
              Add New Address
            </h2>

            <div className="space-y-4">
              <input
                name="full_name"
                autoComplete="name"
                placeholder="Full Name"
                aria-label="Full Name"
                value={formData.full_name}
                onChange={(event) =>
                  updateField('full_name', event.target.value)
                }
                className="input-dark"
                required
              />

              <input
                name="phone_number"
                type="tel"
                autoComplete="tel"
                placeholder="Phone Number"
                aria-label="Phone Number"
                value={formData.phone_number}
                onChange={(event) =>
                  updateField('phone_number', event.target.value)
                }
                className="input-dark"
                required
              />

              <input
                name="address_line_1"
                autoComplete="address-line1"
                required
                placeholder="Address Line 1"
                aria-label="Address Line 1"
                value={formData.address_line_1}
                onChange={(event) =>
                  updateField('address_line_1', event.target.value)
                }
                className="input-dark text-sm"
              />

              <input
                name="address_line_2"
                autoComplete="address-line2"
                placeholder="Address Line 2 (optional)"
                aria-label="Address Line 2"
                value={formData.address_line_2}
                onChange={(event) =>
                  updateField('address_line_2', event.target.value)
                }
                className="input-dark text-sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="city"
                  autoComplete="address-level2"
                  required
                  placeholder="City"
                  aria-label="City"
                  value={formData.city}
                  onChange={(event) =>
                    updateField('city', event.target.value)
                  }
                  className="input-dark text-sm"
                />

                <input
                  name="state"
                  autoComplete="address-level1"
                  required
                  placeholder="State"
                  aria-label="State"
                  value={formData.state}
                  onChange={(event) =>
                    updateField('state', event.target.value)
                  }
                  className="input-dark text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="postal_code"
                  autoComplete="postal-code"
                  required
                  placeholder="Postal Code"
                  aria-label="Postal Code"
                  value={formData.postal_code}
                  onChange={(event) =>
                    updateField('postal_code', event.target.value)
                  }
                  className="input-dark text-sm"
                />

                <input
                  name="country"
                  autoComplete="country-name"
                  required
                  placeholder="Country"
                  aria-label="Country"
                  value={formData.country}
                  onChange={(event) =>
                    updateField('country', event.target.value)
                  }
                  className="input-dark text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(event) =>
                    updateField('is_default', event.target.checked)
                  }
                  className="rounded bg-zinc-900 border-zinc-700 text-violet-500"
                />

                <span className="text-sm text-zinc-400">
                  Set as default address
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm px-6 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={resetForm}
                className="btn-ghost text-sm px-6 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Address list */}
        {loading ? (
          <div
            className="animate-pulse space-y-4"
            aria-label="Loading addresses"
          >
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
          </div>
        ) : error && addresses.length === 0 ? (
          <div
            role="alert"
            className="dark-card p-8 text-center rounded-2xl"
          >
            <p className="text-red-400 mb-4">{error}</p>

            <button
              type="button"
              onClick={() => void loadAddresses()}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : addresses.length === 0 ? (
          <div className="dark-card p-8 text-center">
            <MapPin className="w-8 h-8 text-zinc-500 mx-auto mb-3" />

            <p className="text-white font-medium">
              No saved addresses yet
            </p>

            <p className="text-sm text-zinc-400 mt-2">
              Add an address to make checkout easier.
            </p>

            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="btn-primary mt-5 px-5 py-2.5 text-sm"
              >
                Add your first address
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="dark-card p-5 relative group rounded-2xl"
              >
                {addr.is_default && (
                  <span className="absolute top-4 right-4 badge-violet text-[10px]">
                    Default
                  </span>
                )}

                <div className="flex gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-zinc-500 flex-shrink-0" />

                  <div className="min-w-0 pr-12">
                    <p className="text-white text-sm font-medium">
                      {addr.full_name}
                    </p>

                    {addr.phone_number && (
                      <p className="text-zinc-400 text-sm mt-0.5">
                        {addr.phone_number}
                      </p>
                    )}

                    <p className="text-white text-sm mt-1">
                      {addr.address_line_1}
                    </p>

                    {addr.address_line_2 && (
                      <p className="text-zinc-400 text-sm mt-0.5">
                        {addr.address_line_2}
                      </p>
                    )}

                    <p className="text-zinc-400 text-sm mt-0.5">
                      {addr.city}, {addr.state} {addr.postal_code}
                    </p>

                    <p className="text-zinc-400 text-sm mt-0.5">
                      {addr.country}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.04] flex justify-end">
                  <button
                    type="button"
                    disabled={deletingId === addr.id}
                    onClick={() => void handleDelete(addr.id)}
                    className="text-xs text-error-400 hover:text-error-300 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === addr.id
                      ? 'Deleting...'
                      : 'Delete'}
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
