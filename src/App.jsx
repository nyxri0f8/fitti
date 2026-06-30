import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('fitti_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.phone_number_1) {
          return 'order';
        }
      } catch (e) {}
    }
    return 'landing';
  });
  const pageRef = useRef(page);
  pageRef.current = page;

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

  // PWA Installation prompt state
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`PWA installation user response: ${outcome}`);
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  // Sync session and handle Google OAuth callback redirects
  useEffect(() => {
    if (supabase) {
      const loadProfile = async (session) => {
        if (!session) return;
        const email = session.user.email.toLowerCase();
        const result = await dbService.getProfile(email);

        // Read local cache to protect against transient DB query / RLS issues
        let cachedProfile = null;
        const local = localStorage.getItem('fitti_user_profile');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed && parsed.email && parsed.email.toLowerCase() === email) {
              cachedProfile = parsed;
            }
          } catch (e) {}
        }

        const dbProfile = (result.success && result.data) ? result.data : null;
        const finalProfile = dbProfile || cachedProfile;

        if (finalProfile && finalProfile.phone_number_1) {
          setUser(finalProfile);
          localStorage.setItem('fitti_user_profile', JSON.stringify(finalProfile));
          if (pageRef.current === 'landing' || pageRef.current === 'auth' || window.location.hash.includes('access_token')) {
            setPage('order');
          }
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          const profile = {
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            ...finalProfile
          };
          setUser(profile);
          localStorage.setItem('fitti_user_profile', JSON.stringify(profile));
          if (window.location.hash.includes('access_token') || !profile.phone_number_1) {
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
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} onLogout={handleLogout} />
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
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} onLogout={handleLogout} />
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
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} onLogout={handleLogout} />
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
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} onLogout={handleLogout} />
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
            <Navbar onNavigate={handleNavigate} page={page} user={user} onProfileClick={() => setIsProfileOpen(true)} onLogout={handleLogout} />
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

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && installPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999,
              background: 'rgba(18, 18, 18, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(118, 185, 0, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '360px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'var(--fitti-green, #76b900)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '20px',
                color: '#fff'
              }}>
                F
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>Install Fitti App</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Get quick access and offline features on your home screen.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowInstallBanner(false)}
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Not Now
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleInstallClick}
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Install
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
