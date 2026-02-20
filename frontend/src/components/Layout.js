import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);
  const [dutyMenuOpen, setDutyMenuOpen] = useState(false);
  const [tfcMenuOpen, setTfcMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'डैशबोर्ड',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      path: '/dashboard',
    },
    {
      name: 'कर्मचारी',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      path: '/employees',
    },
    {
      name: 'यूनिट्स',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: '/units',
      adminOnly: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden mr-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-blue-600">Signal Office</h1>
              <p className="ml-2 text-sm text-gray-500 hidden sm:block">प्रबंधन प्रणाली</p>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'office_admin' ? 'Admin' : 'Unit Incharge'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 bg-white shadow-lg fixed top-16 left-0 bottom-0 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              if (item.adminOnly && user?.role !== 'office_admin') return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Employee Field Settings */}
            {user?.role === 'office_admin' && (
              <Link
                to="/employee-field-settings"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === '/employee-field-settings'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>कर्मचारी फील्ड सेटिंग्स</span>
              </Link>
            )}

            {/* Employee Reports */}
            <Link
              to="/employee-reports"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname === '/employee-reports'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>कर्मचारी रिपोर्ट</span>
            </Link>

            {/* छुट्टी प्रबंधन Dropdown */}
            <div>
              <button
                onClick={() => setLeaveMenuOpen(!leaveMenuOpen)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition ${
                  location.pathname.startsWith('/leaves') || location.pathname === '/holidays' || location.pathname === '/leave-settings'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>छुट्टी प्रबंधन</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${leaveMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {leaveMenuOpen && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-blue-200 pl-4">
                  <Link
                    to="/leaves"
                    className={`block px-4 py-2 rounded-lg transition text-sm ${
                      location.pathname === '/leaves'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/leaves/add"
                    className={`block px-4 py-2 rounded-lg transition text-sm ${
                      location.pathname === '/leaves/add'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Add Leave
                  </Link>
                  <Link
                    to="/leaves/all"
                    className={`block px-4 py-2 rounded-lg transition text-sm ${
                      location.pathname === '/leaves/all'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Leaves
                  </Link>
                  <Link
                    to="/leaves/reports"
                    className={`block px-4 py-2 rounded-lg transition text-sm ${
                      location.pathname === '/leaves/reports'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Leave Reports
                  </Link>
                  {user?.role === 'office_admin' && (
                    <>
                      <Link
                        to="/holidays"
                        className={`block px-4 py-2 rounded-lg transition text-sm ${
                          location.pathname === '/holidays'
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Holidays
                      </Link>
                      <Link
                        to="/leave-settings"
                        className={`block px-4 py-2 rounded-lg transition text-sm ${
                          location.pathname === '/leave-settings'
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Leave Settings
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* NEW: ड्यूटी प्रबंधन Dropdown */}
            {user?.role === 'office_admin' && (
              <div>
                <button
                  onClick={() => setDutyMenuOpen(!dutyMenuOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition ${
                    location.pathname.startsWith('/gate-duty') || location.pathname.startsWith('/out-duty')                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>ड्यूटी प्रबंधन</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${dutyMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dutyMenuOpen && (
  <div className="ml-4 mt-2 space-y-1 border-l-2 border-blue-200 pl-4">
    <Link
      to="/out-duty"
      className={`block px-4 py-2 rounded-lg transition text-sm ${
        location.pathname === '/out-duty'
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      आउट ड्यूटी एवं ट्रेनिंग
    </Link>
    <Link
      to="/gate-duty/setup"
      className={`block px-4 py-2 rounded-lg transition text-sm ${
        location.pathname === '/gate-duty/setup'
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      गेट ड्यूटी Setup
    </Link>
    <Link
      to="/gate-duty/roster"
      className={`block px-4 py-2 rounded-lg transition text-sm ${
        location.pathname === '/gate-duty/roster'
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      गेट ड्यूटी Roster
    </Link>
    {/* NEW: Gate Duty Reports */}
    <Link
      to="/gate-duty/reports"
      className={`block px-4 py-2 rounded-lg transition text-sm ${
        location.pathname === '/gate-duty/reports'
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      गेट ड्यूटी Reports
    </Link>
  </div>
)}
              </div>
           )}

            {/* TFC Store - Only for Admin or TFC Incharge */}
            {(user?.role === 'office_admin' || user?.tfcStoreAccess) && (
              <div>
                <button
                  onClick={() => setTfcMenuOpen(!tfcMenuOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition ${
                    location.pathname.startsWith('/tfc-store')
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>TFC Store</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${tfcMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {tfcMenuOpen && (
                  <div className="ml-4 mt-2 space-y-1 border-l-2 border-blue-200 pl-4">
                    {/* TFC Management - Only TFC Incharge */}
                    {user?.tfcStoreAccess && (
                      <Link
                        to="/tfc-store/manage"
                        className={`block px-4 py-2 rounded-lg transition text-sm ${
                          location.pathname === '/tfc-store/manage'
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        TFC Management
                      </Link>
                    )}
                    
                    {/* TFC Reports - Admin + TFC Incharge */}
                    <Link
                      to="/tfc-store/reports"
                      className={`block px-4 py-2 rounded-lg transition text-sm ${
                        location.pathname === '/tfc-store/reports'
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      TFC Reports
                    </Link>
                  </div>
                )}
              </div>
            )}

            

            {/* Store */}
            <Link
              to="/store"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname === '/store'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>स्टोर</span>
            </Link>

            {/* Equipment */}
            {user?.role === 'office_admin' && (
              <Link
                to="/equipment"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === '/equipment'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>उपकरण</span>
              </Link>
            )}
          </nav>
        </aside>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-blue-600">Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="space-y-2">
                  {/* Mobile menu items - same structure as desktop */}
                  {menuItems.map((item) => {
                    if (item.adminOnly && user?.role !== 'office_admin') return null;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                          location.pathname === item.path
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                  {/* Rest of mobile menu - same as desktop sidebar */}
                  {/* Add all the same menu items here */}
                </nav>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;