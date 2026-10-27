import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCatalog } from "./catalog";
import { gramsLabel } from "./format";

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
  const { products } = useCatalog();
  const [items, setItems] = useState(readCart);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  function stockOf(productId) {
    const product = products.find((item) => item.id === productId);
    const grams = Number(product?.stockGrams);
    return Number.isFinite(grams) ? grams : null;
  }

  function roomFor(productId, extra, exceptKey) {
    const have = stockOf(productId);
    if (have === null) return true;
    const held = items.reduce((sum, item) => {
      if (item.productId !== productId || item.key === exceptKey) return sum;
      return sum + Number(item.grams) * Number(item.qty);
    }, 0);
    return held + extra <= have;
  }

  function block(productId, name) {
    const have = stockOf(productId);
    setNotice(have > 0 ? `${name} is sold out. Only ${gramsLabel(have)} is left.` : `${name} is sold out`);
    setOpen(true);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0), [items]);

  function add(product, pack, qty = 1) {
    const extra = Number(pack.grams) * Math.max(1, Number(qty) || 1);
    if (!roomFor(product.id, extra)) {
      block(product.id, product.name);
      return;
    }
    setNotice("");
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
    const item = items.find((entry) => entry.key === key);
    if (item && qty >= 1 && !roomFor(item.productId, Number(item.grams) * qty, key)) {
      block(item.productId, item.name);
      return;
    }
    setNotice("");
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
    <CartContext.Provider value={{ items, count, total, open, setOpen, notice, setNotice, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
