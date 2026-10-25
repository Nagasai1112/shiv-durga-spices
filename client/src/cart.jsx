import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "shiv-durga-cart";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0), [items]);

  function add(product, pack, qty = 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.productId === product.id && item.grams === pack.grams);
      if (index === -1) {
        return [
          ...current,
          {
            key: `${product.id}-${pack.grams}`,
            productId: product.id,
            name: product.name,
            grams: pack.grams,
            label: pack.label,
            unitPrice: pack.price,
            qty,
          },
        ];
      }
      return current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, qty: item.qty + qty } : item,
      );
    });
    setOpen(true);
  }

  function setQty(key, qty) {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.key !== key) return [item];
        if (qty < 1) return [];
        return [{ ...item, qty }];
      }),
    );
  }

  function remove(key) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function clear() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, count, total, open, setOpen, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
