
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  MapPin,
  ChevronDown,
  Sparkles,
  Bell,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
];

const profileLinks = [
  { icon: User, label: 'My Profile', to: '/profile' },
  { icon: Package, label: 'My Orders', to: '/orders' },
  { icon: MapPin, label: 'Addresses', to: '/addresses' },
  { icon: Heart, label: 'Wishlist', to: '/wishlist' },
];

function NotificationPanel({
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  mobile = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={
        mobile
          ? 'fixed left-2 right-2 top-16 z-[9999] glass-card-elevated border border-white/10 overflow-hidden rounded-2xl shadow-2xl'
          : 'absolute right-0 top-full mt-2 w-80 z-[9999] glass-card-elevated border border-white/10 overflow-hidden rounded-2xl shadow-2xl'
      }
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Notifications
          </h3>

          {unreadCount > 0 && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className={mobile ? 'max-h-72 overflow-y-auto' : 'max-h-80 overflow-y-auto'}>
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-500">
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`group px-4 py-3 border-b border-white/[0.04] transition-colors ${
                notification.is_read
                  ? 'bg-transparent'
                  : 'bg-violet-500/[0.05]'
              }`}
            >
              <div className="flex gap-3">
                <div className="mt-1 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-violet-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white break-words">
                      {notification.title}
                    </p>

                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      className="flex-shrink-0 text-zinc-600 hover:text-red-400 transition-colors"
                      aria-label={`Delete notification: ${notification.title}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed break-words">
                    {notification.message}
                  </p>

                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className="text-[11px] text-violet-400 hover:text-violet-300 mt-2"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const desktopNotificationRef = useRef(null);
  const mobileNotificationRef = useRef(null);

  // Update the navbar appearance when the page scrolls.
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close dropdowns when the user clicks outside them.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }

      const clickedOutsideDesktopNotifications =
        !desktopNotificationRef.current?.contains(event.target);

      const clickedOutsideMobileNotifications =
        !mobileNotificationRef.current?.contains(event.target);

      if (
        clickedOutsideDesktopNotifications &&
        clickedOutsideMobileNotifications
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationToggle = async () => {
    if (notificationOpen) {
      setNotificationOpen(false);
      return;
    }

    setNotificationOpen(true);

    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      return;
    }

    navigate(`/products?search=${encodeURIComponent(query)}`);

    setSearchQuery('');
    setSearchOpen(false);
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setProfileOpen(false);
    setMobileOpen(false);
    setNotificationOpen(false);

    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const notificationProps = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-2.5 flex-shrink-0"
              aria-label="LilBunny home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              <span className="font-display font-bold text-xl text-white tracking-tight">
                Lil<span className="text-gradient-violet">Bunny</span>
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-8"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link ${
                    location.pathname === link.to ? 'active' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Search */}
              <div ref={searchRef} className="relative">
                <AnimatePresence mode="wait">
                  {searchOpen ? (
                    <motion.form
                      key="search-form"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        damping: 25,
                        stiffness: 300,
                      }}
                      onSubmit={handleSearch}
                      className="overflow-hidden"
                    >
                      <div className="relative flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-zinc-500 pointer-events-none" />

                        <input
                          autoFocus
                          type="search"
                          value={searchQuery}
                          onChange={(event) =>
                            setSearchQuery(event.target.value)
                          }
                          placeholder="Search products..."
                          aria-label="Search products"
                          className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                        />
                      </div>
                    </motion.form>
                  ) : (
                    <motion.button
                      key="search-button"
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSearchOpen(true)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                      aria-label="Open product search"
                    >
                      <Search className="w-5 h-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Desktop notifications */}
              {isAuthenticated && (
                <div
                  ref={desktopNotificationRef}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={handleNotificationToggle}
                    className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                    aria-label={`Notifications${
                      unreadCount > 0 ? `, ${unreadCount} unread` : ''
                    }`}
                    aria-expanded={notificationOpen}
                  >
                    <Bell className="w-5 h-5" />

                    <AnimatePresence>
                      {unreadCount > 0 && (
                        <motion.span
                          key="desktop-notification-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-gradient-violet rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  <AnimatePresence>
                    {notificationOpen && (
                      <NotificationPanel
                        {...notificationProps}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                aria-label={`Shopping cart, ${cartCount} items`}
              >
                <ShoppingCart className="w-5 h-5" />

                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="desktop-cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-gradient-violet rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Desktop profile dropdown */}
              {isAuthenticated ? (
                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200"
                    aria-expanded={profileOpen}
                    aria-label="Open profile menu"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-violet flex items-center justify-center text-white text-sm font-semibold">
                      {user?.first_name?.[0] ||
                        user?.username?.[0] ||
                        'U'}
                    </div>

                    <span className="text-sm text-white font-medium max-w-[80px] truncate">
                      {user?.first_name || user?.username || 'Profile'}
                    </span>

                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                        profileOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-3 w-72 z-[9999] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-white/[0.06]">
                          <p className="text-sm font-medium text-white truncate">
                            {[user?.first_name, user?.last_name]
                              .filter(Boolean)
                              .join(' ') ||
                              user?.username ||
                              'My Account'}
                          </p>

                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {user?.email}
                          </p>
                        </div>

                        <div className="py-1">
                          {profileLinks.map(
                            ({ icon: Icon, label, to }) => (
                              <Link
                                key={to}
                                to={to}
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                              >
                                <Icon className="w-4 h-4 text-zinc-500" />
                                {label}
                              </Link>
                            )
                          )}

                          <div className="border-t border-white/[0.06] mt-1 pt-1">
                            <button
                              type="button"
                              onClick={handleLogout}
                              disabled={loggingOut}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              <LogOut className="w-4 h-4" />
                              {loggingOut ? 'Signing out...' : 'Sign Out'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn-ghost text-sm px-4 py-2"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile actions */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Mobile notifications */}
              {isAuthenticated && (
                <div
                  ref={mobileNotificationRef}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={handleNotificationToggle}
                    className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    aria-label={`Notifications${
                      unreadCount > 0 ? `, ${unreadCount} unread` : ''
                    }`}
                    aria-expanded={notificationOpen}
                  >
                    <Bell className="w-5 h-5" />

                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-gradient-violet rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationOpen && (
                      <NotificationPanel
                        {...notificationProps}
                        mobile
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile cart */}
              <Link
                to="/cart"
                className="relative p-2 rounded-xl text-zinc-400 hover:text-white transition-colors"
                aria-label={`Shopping cart, ${cartCount} items`}
              >
                <ShoppingCart className="w-5 h-5" />

                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-gradient-violet rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen((open) => !open);
                  setNotificationOpen(false);
                }}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu and backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden"
              onClick={closeMobileMenu}
              aria-label="Close navigation menu"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 300,
              }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] max-w-[85vw] bg-zinc-950 border-l border-white/[0.08] flex flex-col lg:hidden overflow-y-auto"
            >
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <span className="font-display font-bold text-lg text-white">
                  Menu
                </span>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile search */}
              <div className="p-4 border-b border-white/[0.06]">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      placeholder="Search products..."
                      aria-label="Search products"
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </form>
              </div>

              {/* Main mobile navigation */}
              <nav
                aria-label="Mobile navigation"
                className="p-3 space-y-1"
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'bg-violet-500/10 text-violet-400'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile account links */}
              {isAuthenticated ? (
                <>
                  <div className="border-t border-white/[0.06] pt-3 mt-1 px-3 space-y-1">
                    <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      My Account
                    </p>

                    {profileLinks.map(
                      ({ icon: Icon, label, to }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <Icon className="w-4 h-4 text-zinc-500" />
                          {label}
                        </Link>
                      )
                    )}
                  </div>

                  <div className="border-t border-white/[0.06] pt-3 mt-3 px-3">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {loggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-white/[0.06] pt-3 mt-3 px-4 space-y-2">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="btn-ghost w-full text-center text-sm py-3 block"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="btn-primary w-full text-center text-sm py-3 block"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Reserve space below the fixed navbar */}
      <div className="h-16 lg:h-[72px]" />
    </>
  );
}
