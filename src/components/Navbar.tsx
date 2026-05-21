import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSession, authClient } from "../lib/auth-client";
import { useState, useRef, useEffect } from "react";
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  UserIcon,
  ArrowRightOnRectangleIcon 
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      setIsMenuOpen(false);
      setIsProfileDropdownOpen(false);
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

  const handleNavClick = () => {
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 font-bold text-xl text-blue-600 tracking-tight"
            onClick={handleNavClick}
          >
            Masjid Nurul Huda
          </Link>

          {/* Desktop Navigation - Activates at 768px (md:) */}
          <div className="hidden md:flex items-center ml-auto gap-6">
            <ul className="flex gap-6">
              {navItems.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `font-medium transition-colors pb-1 ${
                        isActive 
                          ? "text-blue-600 border-b-2 border-blue-600" 
                          : "text-gray-600 hover:text-blue-600"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Desktop Auth / User Dropdown */}
            <div className="pl-4 border-l border-gray-200">
              {session?.user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none rounded-full ring-2 ring-transparent focus:ring-blue-100 transition-all"
                  >
                    {session.user.image ? (
                      <img 
                        src={session.user.image} 
                        alt="Profile" 
                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <UserCircleIcon className="w-9 h-9 text-gray-400" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.user.name || "Pengguna"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={handleNavClick}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                          Profil Saya
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Log Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition shadow-sm"
                >
                  Log Masuk
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button - Hides at 768px (md:hidden) */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -mr-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu - Hides at 768px (md:hidden) */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white absolute left-0 right-0 shadow-lg pb-4 px-4 pt-2 animate-in slide-in-from-top-2">
            <ul className="flex flex-col gap-1 mb-4">
              {navItems.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.href}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-lg font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Mobile User Section */}
            <div className="border-t border-gray-100 pt-4">
              {session?.user ? (
                <div className="space-y-4">
                  {/* User Info Display */}
                  <div className="flex items-center px-4 gap-3">
                    {session.user.image ? (
                      <img 
                        src={session.user.image} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <UserCircleIcon className="w-10 h-10 text-gray-400" />
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-gray-900 text-sm truncate">{session.user.name}</span>
                      <span className="text-xs text-gray-500 truncate">{session.user.email}</span>
                    </div>
                  </div>
                  
                  {/* Mobile Actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/profile"
                      onClick={handleNavClick}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <UserIcon className="w-5 h-5" />
                      Profil Saya
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      Log Keluar
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={handleNavClick}
                  className="block w-full text-center text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition shadow-sm"
                >
                  Log Masuk
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;