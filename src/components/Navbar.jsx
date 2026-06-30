import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

export default function Navbar({ onNavigate, user, onProfileClick, onLogout, page }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navLinks = [
    { label: 'Execution', href: '#products' },
    { label: 'Workflow', href: '#how-it-works' },
    { label: 'Plans', href: '#why-fitti' },
  ];

  const handleNavClick = (href) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(href);
    } else if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <motion.nav
        className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
      >
        <div className="navbar-inner">
          <a href="#" className="navbar-logo" onClick={(e) => { e.preventDefault(); handleNavClick('#landing'); }}>
            Fitti<span className="text-green">.</span>
          </a>

          <div className="navbar-links-desktop">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="navbar-link"
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="navbar-actions">
            {page !== 'landing' && (
              user ? (
                <>
                  <button className="navbar-profile-btn" onClick={onProfileClick} aria-label="View Profile" title="View Profile">
                    <span className="profile-avatar-initial">{user.name.charAt(0).toUpperCase()}</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm navbar-logout-btn"
                    onClick={onLogout}
                    style={{
                      borderColor: 'rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                      background: 'rgba(239, 68, 68, 0.03)',
                      marginRight: 'var(--space-2)'
                    }}
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-secondary btn-sm navbar-login-btn"
                  onClick={() => handleNavClick('auth')}
                  style={{ marginRight: 'var(--space-2)' }}
                >
                  LOGIN
                </button>
              )
            )}

            <button
              className="btn btn-primary btn-sm navbar-cta-desktop"
              onClick={() => handleNavClick('#order')}
            >
              ORDER FOOD
              <span className="btn-icon">→</span>
            </button>

            <button
              className="navbar-hamburger"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="mobile-menu-content"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            >
              {page !== 'landing' && (
                user ? (
                  <>
                    <motion.a
                      className="mobile-menu-link text-green"
                      style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--fitti-green)', marginBottom: '0.5rem' }}
                      onClick={() => { setIsOpen(false); onProfileClick(); }}
                    >
                      My Profile ({user.name})
                    </motion.a>
                    <motion.a
                      className="mobile-menu-link text-red"
                      style={{ cursor: 'pointer', fontWeight: 800, color: '#ef4444', marginBottom: '1rem' }}
                      onClick={() => { setIsOpen(false); onLogout && onLogout(); }}
                    >
                      Logout Account
                    </motion.a>
                  </>
                ) : (
                  <motion.a
                    className="mobile-menu-link"
                    style={{ cursor: 'pointer', fontWeight: 800, marginBottom: '1rem' }}
                    onClick={() => { setIsOpen(false); handleNavClick('auth'); }}
                  >
                    Login / Sign In
                  </motion.a>
                )
              )}

              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="mobile-menu-link"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{ marginTop: '2rem' }}
              >
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={() => handleNavClick('#order')}
                >
                  ORDER FOOD
                  <span className="btn-icon">→</span>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
