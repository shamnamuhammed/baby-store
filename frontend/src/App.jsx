
import React,{  lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';

import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Existing contexts
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

// Existing route protection
import ProtectedRoute from './components/ProtectedRoute';

// New admin components
import AdminRoute from './components/AdminRoute';
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const AdminProducts = lazy(
  () => import('./pages/admin/AdminProducts')
);
const AdminCategories = lazy(
  () => import('./pages/admin/AdminCategories')
);
const AdminBrands = lazy(
  () => import('./pages/admin/AdminBrands')
);
const AdminOrders = lazy(
  () => import('./pages/admin/AdminOrders')
);
const AdminCustomers = lazy(
  () => import('./pages/admin/AdminCustomers')
);
const AdminPayments = lazy(
  () => import('./pages/admin/AdminPayments')
);
const AdminCoupons = lazy(
  () => import('./pages/admin/AdminCoupons')
);
const AdminOffers = lazy(
  () => import('./pages/admin/AdminOffers')
);
// Existing customer pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import NotFound from './pages/NotFound';
import PaymentCancel from './pages/PaymentCancel';
import PaymentSuccess from './pages/PaymentSuccess';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Customer public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Customer product routes */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        {/* Customer protected routes */}
        <Route
          path="/cart"
          element={<ProtectedRoute><Cart /></ProtectedRoute>}
        />
        <Route
          path="/wishlist"
          element={<ProtectedRoute><Wishlist /></ProtectedRoute>}
        />
        <Route
          path="/checkout"
          element={<ProtectedRoute><Checkout /></ProtectedRoute>}
        />
        <Route
          path="/order-success"
          element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>}
        />
        <Route
          path="/orders"
          element={<ProtectedRoute><Orders /></ProtectedRoute>}
        />
        <Route
          path="/orders/:id"
          element={<ProtectedRoute><OrderDetail /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />
        <Route
          path="/addresses"
          element={<ProtectedRoute><Addresses /></ProtectedRoute>}
        />
        <Route
          path="/payment/success"
          element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>}
        />
        <Route
          path="/payment/cancel"
          element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>}
        />

        {/* Admin routes: staff-only access */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands  />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Customer 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  React.useEffect(() => {
    document.documentElement.classList.add('dark');

    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-zinc-950 font-sans text-white selection:bg-violet-500/30 selection:text-violet-200">
              <AnimatedRoutes />
            </div>

            <Toaster
              position="bottom-right"
              toastOptions={{
                className:
                  '!rounded-xl !border !border-white/10 !bg-zinc-900 !text-sm !text-white !shadow-xl',
                success: {
                  iconTheme: {
                    primary: '#22C55E',
                    secondary: '#18181B',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#18181B',
                  },
                },
              }}
            />
          </Router>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
