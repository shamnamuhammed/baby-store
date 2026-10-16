
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import api from '../utils/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

/**
 * Keep existing cart items in their current order when a fresh
 * backend response arrives. Any genuinely new items are appended.
 */
function preserveCartOrder(previousItems, incomingItems) {
  if (!Array.isArray(incomingItems)) {
    return [];
  }

  if (!Array.isArray(previousItems) || previousItems.length === 0) {
    return incomingItems;
  }

  const incomingById = new Map(
    incomingItems.map((item) => [String(item.id), item]),
  );

  const orderedItems = [];
  const includedIds = new Set();

  // Keep existing items in the order the user already sees.
  for (const previousItem of previousItems) {
    const id = String(previousItem.id);
    const updatedItem = incomingById.get(id);

    // Items removed by the backend should not remain in the cart.
    if (updatedItem) {
      orderedItems.push(updatedItem);
      includedIds.add(id);
    }
  }

  // Append new items without rearranging existing ones.
  for (const item of incomingItems) {
    const id = String(item.id);

    if (!includedIds.has(id)) {
      orderedItems.push(item);
      includedIds.add(id);
    }
  }

  return orderedItems;
}

function getCartCount(items) {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setCartCount(0);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const response = await api.get('/api/cart/');
      const cartData = response.data?.data ?? response.data;

      const incomingItems = Array.isArray(cartData?.items)
        ? cartData.items
        : [];

      // Preserve the displayed order while refreshing current values.
      setCart((previousCart) => ({
        ...cartData,
        items: preserveCartOrder(
          previousCart?.items,
          incomingItems,
        ),
      }));

      setCartCount(getCartCount(incomingItems));

      return cartData;
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Refresh the cart when authentication changes.
  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      if (!isAuthenticated) {
        setCart(null);
        setCartCount(0);
        setLoading(false);
        return;
      }

      try {
        await fetchCart();
      } catch {
        // Keep the error from breaking the application.
      }
    };

    if (!cancelled) {
      void loadCart();
    }

    return () => {
      cancelled = true;
    };
  }, [fetchCart, isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    const response = await api.post('/api/cart/add/', {
      product: productId,
      quantity,
    });

    await fetchCart();

    return response.data;
  };

  const updateCartItem = async (itemId, quantity) => {
    const response = await api.patch(
      `/api/cart/items/${itemId}/`,
      { quantity },
    );

    // Refresh prices, discounts and totals from the backend.
    // Existing cart item positions are preserved.
    await fetchCart();

    return response.data;
  };

  const removeCartItem = async (itemId) => {
    await api.delete(`/api/cart/items/${itemId}/delete/`);

    await fetchCart();
  };

  const contextValue = {
    cart,
    cartCount,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeCartItem,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}

export default CartContext;
