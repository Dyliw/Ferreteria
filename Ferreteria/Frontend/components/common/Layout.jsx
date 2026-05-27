import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="lg:ml-64">
        <Navbar />
        <main className="p-4 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;