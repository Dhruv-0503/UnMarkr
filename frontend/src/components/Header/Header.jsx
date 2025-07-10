import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiLogIn, FiUserPlus, FiHome, FiGrid } from 'react-icons/fi';

const Header = () => {
  const authUser = true;
  return (
    <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/10 shadow-md px-6 py-4 flex justify-between items-center">
      <div className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-glow select-none">
        Unmarkr
      </div>

      <ul className="flex items-center gap-4 md:gap-6 text-sm md:text-base font-medium text-black-100">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-blue-300 transition duration-200"
          >
            <FiHome className="text-lg" /> Home
          </Link>
        </li>

        {authUser ? (
          <>
            <li>
              <Link
                to="/dashboard"
                className="flex items-center gap-1 hover:text-blue-300 transition duration-200"
              >
                <FiGrid className="text-lg" /> Dashboard
              </Link>
            </li>
            <li>
              <button
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg font-semibold transition duration-200 shadow-md"
              >
                <FiLogOut className="text-lg" /> Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link
                to="/login"
                className="flex items-center gap-1 hover:text-blue-300 transition duration-200"
              >
                <FiLogIn className="text-lg" /> Login
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className="flex items-center gap-1 hover:text-blue-300 transition duration-200"
              >
                <FiUserPlus className="text-lg" /> Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Header