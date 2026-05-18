import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSession, authClient } from "../lib/auth-client";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const Navbar = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 font-bold text-xl text-blue-600"
          >
            Masjid Nurul Huda
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center ml-auto gap-12">
            <ul className="flex gap-10">
              {navItems.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `font-medium transition ${isActive ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-700 hover:text-blue-600"}`
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-blue-600"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <ul className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.href}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded font-medium transition ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-blue-50"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}

              <li className="px-4 pt-2">
                {session?.user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded font-medium transition"
                  >
                    Log Keluar
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={handleNavClick}
                    className="block w-full text-center text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium transition"
                  >
                    Log Masuk
                  </Link>
                )}
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
