
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import InputField from '../components/InputField';
import LoadingButton from '../components/LoadingButton';
import FormError from '../components/FormError';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { Camera, UserRound, Upload, X } from 'lucide-react';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

function getImageUrl(image) {
  if (!image) {
    return '';
  }

  try {
    return new URL(
      image,
      `${api.defaults.baseURL || window.location.origin}/`
    ).href;
  } catch {
    return '';
  }
}

function getInitials(user) {
  const first = user?.first_name?.trim()?.[0] || '';
  const last = user?.last_name?.trim()?.[0] || '';

  return (
    `${first}${last}`.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    'U'
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();

  // Remount the form when the saved profile details change.
  const profileKey = [
    user?.id ?? '',
    user?.first_name ?? '',
    user?.last_name ?? '',
    user?.phone_number ?? '',
  ].join(':');

  return (
    <ProfileContent
      key={profileKey}
      user={user}
      refreshUser={refreshUser}
    />
  );
}

function ProfileContent({ user, refreshUser }) {
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  const [formData, setFormData] = useState(() => ({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
  }));

  // Revoke old preview URLs when the preview changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Your profile image must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageError(false);
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    setImageError(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const payload = new FormData();

      payload.append('first_name', formData.first_name.trim());
      payload.append('last_name', formData.last_name.trim());
      payload.append('phone_number', formData.phone_number.trim());

      if (selectedImage) {
        payload.append('profile_image', selectedImage);
      }

      // Let Axios/browser set the multipart boundary automatically.
      await api.patch('/api/users/me/', payload);

      await refreshUser();

      setSelectedImage(null);
      setPreviewUrl('');
      setImageError(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Profile updated successfully!');
    } catch (err) {
      const responseData = err.response?.data;

      const message =
        responseData?.data?.profile_image?.[0] ||
        responseData?.profile_image?.[0] ||
        responseData?.data?.phone_number?.[0] ||
        responseData?.phone_number?.[0] ||
        responseData?.data?.first_name?.[0] ||
        responseData?.first_name?.[0] ||
        responseData?.data?.last_name?.[0] ||
        responseData?.last_name?.[0] ||
        responseData?.message ||
        responseData?.detail ||
        'Unable to update your profile. Please try again.';

      setError(
        typeof message === 'string'
          ? message
          : 'Please check your profile details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const savedImage = getImageUrl(user?.profile_image);
  const displayedImage = previewUrl || savedImage;

  return (
    <PageTransition>
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">
            Your account
          </p>

          <h1 className="font-display text-3xl font-bold text-white">
            My Profile
          </h1>

          <p className="mt-2 text-zinc-400">
            Manage your personal information and profile photo.
          </p>
        </div>

        <div className="dark-card rounded-3xl p-6 sm:p-8">
          {/* Profile image and upload controls */}
          <div className="mb-8 flex flex-col items-center gap-5 border-b border-white/10 pb-8 sm:flex-row">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-500/30 to-indigo-500/20 text-2xl font-bold text-white shadow-glow-violet">
                {displayedImage && !imageError ? (
                  <img
                    key={displayedImage}
                    src={displayedImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : selectedImage ? (
                  <UserRound size={34} />
                ) : (
                  <span>{getInitials(user)}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose profile photo"
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/30 bg-violet-600 text-white shadow-lg transition hover:bg-violet-500"
              >
                <Camera size={18} />
              </button>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="break-words font-display text-xl font-bold text-white">
                {[user?.first_name, user?.last_name]
                  .filter(Boolean)
                  .join(' ') ||
                  user?.username ||
                  'Your Profile'}
              </h2>

              <p className="mt-1 break-words text-sm text-zinc-400">
                {user?.email}
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
                >
                  <Upload size={15} />
                  {selectedImage
                    ? 'Choose another photo'
                    : 'Upload photo'}
                </button>

                {selectedImage && (
                  <button
                    type="button"
                    onClick={handleCancelImage}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                  >
                    <X size={15} />
                    Cancel photo
                  </button>
                )}
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                JPG, PNG, or WebP · Maximum 5 MB
              </p>

              {selectedImage && (
                <p className="mt-2 break-all text-xs text-violet-300">
                  Selected: {selectedImage.name}
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <FormError
            message={error}
            onClose={() => setError('')}
          />

          {/* Profile form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InputField
                id="first_name"
                name="first_name"
                label="First Name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />

              <InputField
                id="last_name"
                name="last_name"
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <InputField
              id="phone_number"
              name="phone_number"
              label="Phone Number"
              value={formData.phone_number}
              onChange={handleChange}
            />

            <InputField
              id="email"
              label="Email Address"
              value={user?.email || ''}
              disabled
              helpText="Email address cannot be changed."
            />

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                Your changes are saved to your account.
              </p>

              <LoadingButton loading={loading}>
                Save Changes
              </LoadingButton>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </PageTransition>
  );
}
