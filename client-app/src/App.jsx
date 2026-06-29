import { Routes, Route, NavLink } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderHistoryPage from "./pages/OrderHistoryPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";

export default function App() {
  return (
    <AuthProvider>
      <header>
        <nav>
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/login">Login</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}
