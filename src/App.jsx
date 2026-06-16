import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductShowcase from './components/ProductShowcase';
import WhyFitti from './components/WhyFitti';
import HowItWorks from './components/HowItWorks';
import BreakfastBuilder from './components/BreakfastBuilder';
import Checkout from './components/Checkout';
import OrderConfirmation from './components/OrderConfirmation';
import Footer from './components/Footer';
import AdminDashboard from './pages/AdminDashboard';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';
import TicketView from './components/TicketView';
import { supabase } from './supabaseClient';
import { dbService } from './services/db';

// Pages: 'landing' | 'auth' | 'order' | 'checkout' | 'confirmation' | 'admin'
export default function App() {
  const [page, setPage] = useState('landing');
  const [orderData, setOrderData] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [productToAdd, setProductToAdd] = useState(null);

  // Authentication & Profile states
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fitti_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [pendingPage, setPendingPage] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sync session and handle Google OAuth callback redirects
  useEffect(() => {
    if (supabase) {
      const loadProfile = async (session) => {
        if (!session) return;
        const email = session.user.email;
        const result = await dbService.getProfile(email);
        if (result.success && result.data && result.data.phone_number_1) {
          setUser(result.data);
          localStorage.setItem('fitti_user_profile', JSON.stringify(result.data));
          if (window.location.hash.includes('access_token')) {
            setPage('order');
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          const profile = {
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            ...result.data // Merge existing details from database
          };
          setUser(profile);
          localStorage.setItem('fitti_user_profile', JSON.stringify(profile));
          if (window.location.hash.includes('access_token') || !result.data?.phone_number_1) {
            setPage('auth');
            if (window.location.hash.includes('access_token')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
      };

      // 1. Check current session status
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          loadProfile(session);
        }
      });

      // 2. Listen for authentication events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          loadProfile(session);
        } else {
          setUser(null);
          localStorage.removeItem('fitti_user_profile');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleNavigate = useCallback((target) => {
    if (target === '#order' || target === 'order') {
      if (!user) {
        setPendingPage('order');
        setPage('auth');
      } else if (!user.phone_number_1) {
        setPendingPage('order');
        setPage('auth');
      } else {
        setPage('order');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === '#landing' || target === 'landing' || target === '/') {
      setPage('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target.startsWith('#')) {
      // If navigating to an anchor on landing but we are elsewhere
      if (page !== 'landing') {
        setPage('landing');
        setTimeout(() => {
          const el = document.querySelector(target);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [page, user]);

  const handleAuthSuccess = useCallback((userData) => {
    setUser(userData);
    setPage('ticket');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleProceedToCheckout = useCallback((data) => {
    setOrderData(data);
    setPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOrderComplete = useCallback((order) => {
    setCompletedOrder(order);
    setPage('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToBuilder = useCallback(() => {
    setPage('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToHome = useCallback(() => {
    setPage('landing');
    setOrderData(null);
    setCompletedOrder(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLogout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('fitti_user_profile');
    setIsProfileOpen(false);
    setPage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Admin shortcut: type "fittiadmin" anywhere
  useState(() => {
    let buffer = '';
    const handler = (e) => {
      buffer += e.key.toLowerCase();
      if (buffer.length > 10) buffer = buffer.slice(-10);
      if (buffer.includes('fittiadmin')) {
        setPage('admin');
        buffer = '';
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (page === 'admin') {
    return <AdminDashboard onBack={handleBackToHome} />;
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {page === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} />
            <Hero onNavigate={handleNavigate} />
            <ProductShowcase onAddProduct={(product) => {
              setProductToAdd(product);
              if (!user) {
                setPendingPage('order');
                setPage('auth');
              } else {
                setPage('order');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} />
            <WhyFitti />
            <HowItWorks />
            <Footer onNavigate={handleNavigate} />
          </motion.div>
        )}

        {page === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} />
            <div style={{ paddingTop: '100px' }}>
              <AuthView initialGoogleUser={user} onAuthSuccess={handleAuthSuccess} onCancel={() => handleNavigate('landing')} />
            </div>
            <Footer onNavigate={handleNavigate} />
          </motion.div>
        )}

        {page === 'order' && (
          <motion.div
            key="order"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} />
            <div style={{ paddingTop: '100px' }}>
              <BreakfastBuilder
                productToAdd={productToAdd}
                onProductAddedProcessed={() => setProductToAdd(null)}
                onProceedToCheckout={handleProceedToCheckout}
              />
            </div>
            <Footer onNavigate={handleNavigate} />
          </motion.div>
        )}

        {page === 'checkout' && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} />
            <div style={{ paddingTop: '100px' }}>
              <Checkout
                user={user}
                orderData={orderData}
                onOrderComplete={handleOrderComplete}
                onBack={handleBackToBuilder}
              />
            </div>
          </motion.div>
        )}

        {page === 'ticket' && (
          <motion.div
            key="ticket"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} />
            <div style={{ paddingTop: '100px' }}>
              <TicketView
                user={user}
                onProceed={() => {
                  setPage(pendingPage || 'order');
                  setPendingPage(null);
                }}
              />
            </div>
            <Footer onNavigate={handleNavigate} />
          </motion.div>
        )}

        {page === 'confirmation' && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OrderConfirmation
              order={completedOrder}
              onBackToHome={handleBackToHome}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Profile view Modal */}
      <AnimatePresence>
        {isProfileOpen && user && (
          <ProfileView
            user={user}
            onClose={() => setIsProfileOpen(false)}
            onProfileUpdate={(updated) => setUser(updated)}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
