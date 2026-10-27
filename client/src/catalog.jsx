import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState("loading");

  const reload = useCallback(async () => {
    try {
      const [nextProducts, nextSettings, nextOffers] = await Promise.all([
        api("/api/products"),
        api("/api/settings"),
        api("/api/offers").catch(() => []),
      ]);
      setProducts(nextProducts);
      setSettings(nextSettings);
      setOffers(nextOffers);
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
    <CatalogContext.Provider value={{ products, settings, offers, status, reload }}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}
