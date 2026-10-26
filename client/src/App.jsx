import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { scrollToStory } from "./components/SiteLinks";
import { CartProvider } from "./cart";
import { CatalogProvider } from "./catalog";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HomeMarquee } from "./components/HomeMarquee";
import { AddReviewPage } from "./pages/admin/AddReviewPage";
import { AddSpicePage } from "./pages/admin/AddSpicePage";
import { AdminHome } from "./pages/admin/AdminHome";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { PasswordPage } from "./pages/admin/PasswordPage";
import { ReviewsPage } from "./pages/admin/ReviewsPage";
import { ShopPage } from "./pages/admin/ShopPage";
import { SpicesPage } from "./pages/admin/SpicesPage";
import { Home } from "./pages/Home";
import { SignIn } from "./pages/SignIn";
import { Order } from "./pages/Order";
import { Reviews } from "./pages/Reviews";
import { Track } from "./pages/Track";
import { Shop } from "./pages/Shop";
import { SpicePage } from "./pages/SpicePage";

function ScrollToPlace() {
  const { pathname, hash, state } = useLocation();
  const toStory = hash === "#story" || state?.scrollTo === "story";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!toStory) return undefined;
    const timers = [0, 120, 400].map((delay) => window.setTimeout(() => scrollToStory("instant"), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [pathname, toStory]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToPlace />
      <CatalogProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <HomeMarquee />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/spice/:id" element={<SpicePage />} />
                <Route path="/order" element={<Order />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/track" element={<Track />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminHome />} />
                  <Route path="orders" element={<Navigate to="/admin" replace />} />
                  <Route path="spices" element={<SpicesPage />} />
                  <Route path="spices/new" element={<AddSpicePage />} />
                  <Route path="reviews" element={<ReviewsPage />} />
                  <Route path="reviews/new" element={<AddReviewPage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="password" element={<PasswordPage />} />
                </Route>
              </Routes>
            </div>
            <Footer />
          </div>
        </CartProvider>
      </CatalogProvider>
    </BrowserRouter>
  );
}
