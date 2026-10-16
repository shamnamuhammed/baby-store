import React, { useState } from 'react';
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Award,
  ShoppingCart,
  Users,
  CreditCard,
  TicketPercent,
  Percent,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Baby,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  {
    label: 'Overview',
    items: [
      {
        name: 'Dashboard',
        path: '/admin',
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: 'Store management',
    items: [
      {
        name: 'Products',
        path: '/admin/products',
        icon: Package,
      },
      {
        name: 'Categories',
        path: '/admin/categories',
        icon: Tags,
      },
      {
        name: 'Brands',
        path: '/admin/brands',
        icon: Award,
      },
      {
        name: 'Offers',
        path: '/admin/offers',
        icon: Percent,
      },
      {
        name: 'Orders',
        path: '/admin/orders',
        icon: ShoppingCart,
      },
      {
        name: 'Customers',
        path: '/admin/customers',
        icon: Users,
      },
    ],
  },
  {
    label: 'Sales & payments',
    items: [
      {
        name: 'Payments',
        path: '/admin/payments',
        icon: CreditCard,
      },
      {
        name: 'Coupons',
        path: '/admin/coupons',
        icon: TicketPercent,
      },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError('');

    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setLogoutError(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to sign out. Please try again.'
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const handleViewStorefront = () => {
    closeMobileMenu();
    navigate('/');
  };

  const displayName =
    user?.first_name ||
    user?.username ||
    user?.email ||
    'Administrator';

  const avatarLetter = (
    user?.first_name?.[0] ||
    user?.username?.[0] ||
    user?.email?.[0] ||
    'A'
  ).toUpperCase();

  const sidebarContent = (
    <>
      {/* Brand header */}
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
          <Baby size={25} />
        </div>

        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight text-white">
            BabyBliss
          </p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Admin studio
          </p>
        </div>

        <button
          type="button"
          onClick={closeMobileMenu}
          className="ml-auto rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-7 overflow-y-auto px-3 py-6"
      >
        {navigation.map((group) => (
          <div key={group.label}>
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {group.label}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-white',
                      ].join(' ')
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Account section */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-bold text-white">
            {avatarLetter}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {user?.email || 'Admin account'}
            </p>
          </div>

          <ShieldCheck
            size={17}
            className="shrink-0 text-emerald-400"
            aria-label="Admin account"
          />
        </div>

        {logoutError && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300"
          >
            {logoutError}
          </div>
        )}

        <button
          type="button"
          onClick={handleViewStorefront}
          className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={17} />
          View storefront
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loggingOut ? (
            <span className="h-[17px] w-[17px] animate-spin rounded-full border-2 border-red-300/30 border-t-red-300" />
          ) : (
            <LogOut size={17} />
          )}

          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/10 bg-[#101014]',
          'transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-[260px]">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/10 bg-[#09090b]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-white/10 p-2 text-zinc-300 transition hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Open navigation"
              aria-controls="admin-sidebar"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                Administration
              </p>
              <p className="hidden text-xs text-zinc-500 sm:block">
                Manage your store from one place
              </p>
            </div>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">
              Admin access
            </span>
          </div>
        </header>

        {/* Route content */}
        <main
          key={location.pathname}
          className="mx-auto w-full max-w-[1600px] p-4 sm:p-7 lg:p-10"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}