import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "./cart";
import { CatalogProvider } from "./catalog";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Admin } from "./pages/Admin";
import { Home } from "./pages/Home";
import { Order } from "./pages/Order";
import { Shop } from "./pages/Shop";
import { SpicePage } from "./pages/SpicePage";

export default function App() {
  return (
    <BrowserRouter>
      <CatalogProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/spice/:id" element={<SpicePage />} />
                <Route path="/order" element={<Order />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </CartProvider>
      </CatalogProvider>
    </BrowserRouter>
  );
}
