import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import Footer from '../components/Footer';

const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const mainStyle = isHomePage
    ? { flexGrow: 1, width: '100%' }
    : { flexGrow: 1, padding: '2rem 1.5rem', maxWidth: '1200px', width: '100%', margin: '0 auto' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={mainStyle}>
        <Outlet />
      </main>
      <Chatbot />
      <Footer />
    </div>
  );
};

export default Layout;
