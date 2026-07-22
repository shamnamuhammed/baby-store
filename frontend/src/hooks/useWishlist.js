import { useState, useCallback } from 'react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export function useWishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/wishlist/');
      const data = res.data?.data || res.data || [];
      const items = Array.isArray(data) ? data : data.items || [];
      setWishlist(items);
      setWishlistIds(new Set(items.map((i) => i.product?.id || i.product)));
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = async (productId) => {
    try {
      await api.post('/api/wishlist/add/', { product: productId });
      setWishlistIds((prev) => new Set([...prev, productId]));
      toast.success('Added to wishlist!');
      return true;
    } catch {
      toast.error('Failed to add to wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (itemId, productId) => {
    try {
      await api.delete(`/api/wishlist/items/${itemId}/`);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setWishlist((prev) => prev.filter((i) => i.id !== itemId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove from wishlist');
    }
  };

  const clearWishlist = async () => {
    try {
      await api.delete('/api/wishlist/clear/');
      setWishlist([]);
      setWishlistIds(new Set());
      toast.success('Wishlist cleared');
    } catch {
      toast.error('Failed to clear wishlist');
    }
  };

  const isInWishlist = (productId) => wishlistIds.has(productId);

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      const item = wishlist.find((i) => (i.product?.id || i.product) === productId);
      if (item) await removeFromWishlist(item.id, productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return { wishlist, wishlistIds, loading, fetchWishlist, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist, toggleWishlist };
}
