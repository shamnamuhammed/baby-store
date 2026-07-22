import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setCartCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/api/cart/');
      const cartData = res.data?.data || res.data;
      setCart(cartData);
      const items = cartData?.items || [];
      setCartCount(items.reduce((acc, item) => acc + (item.quantity || 1), 0));
    } catch {
      setCart(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await api.post('/api/cart/add/', { product: productId, quantity });
    await fetchCart();
    return res.data;
  };

  const updateCartItem = async (itemId, quantity) => {
    const res = await api.patch(`/api/cart/items/${itemId}/`, { quantity });
    await fetchCart();
    return res.data;
  };

  const removeCartItem = async (itemId) => {
    await api.delete(`/api/cart/items/${itemId}/delete/`);
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateCartItem, removeCartItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export default CartContext;
