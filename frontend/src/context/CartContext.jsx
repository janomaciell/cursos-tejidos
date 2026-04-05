import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('tejiendo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('tejiendo_cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((course) => {
    setItems(prev => {
      const exists = prev.find(item => item.id === course.id);
      if (exists) return prev;
      return [...prev, course];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((courseId) => {
    setItems(prev => prev.filter(item => item.id !== courseId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('tejiendo_cart');
  }, []);

  const isInCart = useCallback((courseId) => {
    return items.some(item => item.id === courseId);
  }, [items]);

  const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const totalItems = items.length;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      isInCart,
      totalPrice,
      totalItems,
      isOpen,
      setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
