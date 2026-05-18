import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSession, authClient } from '../lib/auth-client';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthActionButtonProps {
  isMobile: boolean;
  isPending: boolean;
  isLoggedIn: boolean;
  onLogout: () => void;
}

// ─── Single Auth Button (shared across mobile & desktop) ──────────────────────

const AuthActionButton = ({ isMobile, isPending, isLoggedIn, onLogout }: AuthActionButtonProps) => {
  if (isPending) {
    return (
      <div className={`bg-gray-100 animate-pulse rounded-full ${isMobile ? 'w-16 h-7' : 'w-24 h-9'}`} />
    );
  }

  if (isLoggedIn) {
    return (
      <button
        onClick={onLogout}
        className={`whitespace-nowrap bg-red-500 hover:bg-red-600 text-white font-medium transition rounded-full ${
          isMobile ? 'text-sm px-3 py-1' : 'px-5 py-2'
        }`}
      >
        {isMobile ? 'Keluar' : 'Log Keluar'}
      </button>
    );
  }

  return (
    <Link
      to="/login"
      className={`whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white font-medium transition rounded-full ${
        isMobile ? 'text-sm px-3 py-1' : 'px-5 py-2'
      }`}
    >
      {isMobile ? 'Masuk' : 'Log Masuk'}
    </Link>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = () => {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLoggedIn = !!session?.user;

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      setIsMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Carta Organisasi", href: "/carta" },
    { name: "Sejarah Masjid", href: "/sejarah" },
    // Only add this if the user is logged in
    ...(session?.user ? [{ name: "Pengurusan", href: "/admin" }] : []),
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Main bar — fixed h-16 prevents collapse ── */}
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="shrink-0 font-bold text-xl text-blue-600 whitespace-nowrap">
            Masjid Nurul Huda
          </Link>

          {/* ── Desktop nav (hidden below md) ── */}
          <div className="hidden md:flex items-center gap-10 ml-auto">
            <ul className="flex gap-8">
              {navItems.map(item => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `whitespace-nowrap font-medium transition ${
                        isActive
                          ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                          : 'text-gray-700 hover:text-blue-600'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>

            {session?.user ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full font-medium transition"
              >
                Log Keluar
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition"
              >
                Log Masuk
              </Link>
            )}
          </div>

          {/* ── Mobile controls (hidden from md up) ── */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile auth button — single source */}
            <AuthActionButton
              isMobile={true}
              isPending={isPending}
              isLoggedIn={isLoggedIn}
              onLogout={handleLogout}
            />

            {/* Hamburger toggle — explicit tap target */}
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-1.5 text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              {isMenuOpen
                ? <XMarkIcon className="w-6 h-6" />
                : <Bars3Icon className="w-6 h-6" />
              }
            </button>
          </div>
        </div>

        {/* ── Mobile drawer (strictly md:hidden via conditional render) ── */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 pt-2">
            <ul className="flex flex-col gap-1">
              {navItems.map(item => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-2.5 rounded-lg font-medium transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}

            </ul>
          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;
