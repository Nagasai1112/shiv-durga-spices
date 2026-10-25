import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState("loading");

  const reload = useCallback(async () => {
    try {
      const [nextProducts, nextSettings] = await Promise.all([api("/api/products"), api("/api/settings")]);
      setProducts(nextProducts);
      setSettings(nextSettings);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [reload]);

  return (
    <CatalogContext.Provider value={{ products, settings, status, reload }}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}
