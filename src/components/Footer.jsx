import { useState } from 'react';
import './Footer.css';

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState(null);

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    } else if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-dot"></span>
              FITTI
            </div>
            <p className="footer-tagline">
              Healthy Breakfast. Fully Managed. Fresh in Bangalore, India.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-links">
              <h4 className="footer-links-title">Quick Links</h4>
              <a href="#products" className="footer-link" onClick={(e) => handleLinkClick(e, '#products')}>Menu</a>
              <a href="#why-fitti" className="footer-link" onClick={(e) => handleLinkClick(e, '#why-fitti')}>Why FITTI</a>
              <a href="#how-it-works" className="footer-link" onClick={(e) => handleLinkClick(e, '#how-it-works')}>How It Works</a>
              <a href="#breakfast-builder" className="footer-link" onClick={(e) => handleLinkClick(e, '#order')}>Build Your Plan</a>
            </div>

            <div className="footer-links">
              <h4 className="footer-links-title">Contact & Legal</h4>
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="footer-link">WhatsApp</a>
              <a href="mailto:hello@fitti.in" className="footer-link">hello@fitti.in</a>
              <a href="#privacy" className="footer-link" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>Privacy Policy</a>
              <a href="#terms" className="footer-link" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {currentYear} FITTI. Made with 💚 for healthier mornings.
          </p>
        </div>
      </div>

      {activeModal && (
        <div className="footer-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="footer-modal-content double-bezel" onClick={(e) => e.stopPropagation()}>
            <div className="double-bezel-inner" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="text-green" style={{ margin: 0, fontSize: '1.25rem' }}>
                  {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h3>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setActiveModal(null)}
                  style={{ minWidth: 'auto', padding: '4px 12px' }}
                >
                  Close
                </button>
              </div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', textAlign: 'left', fontSize: '14px', lineHeight: '1.6', color: 'var(--fitti-text-secondary)' }}>
                {activeModal === 'privacy' ? (
                  <>
                    <p style={{ marginBottom: '12px' }}><strong>Effective Date:</strong> June 26, 2026</p>
                    <p style={{ marginBottom: '12px' }}>At FITTI, we respect your privacy. This Privacy Policy describes how we collect, use, and process your personal information when you subscribe to our breakfast delivery services.</p>
                    <h4 style={{ color: 'var(--fitti-text)', marginTop: '16px', marginBottom: '8px' }}>1. Information We Collect</h4>
                    <p style={{ marginBottom: '12px' }}>We collect your name, phone number, delivery address, dietary preferences, and birthday in order to deliver fresh meals and personalize your experience.</p>
                    <h4 style={{ color: 'var(--fitti-text)', marginTop: '16px', marginBottom: '8px' }}>2. How We Use Information</h4>
                    <p style={{ marginBottom: '12px' }}>We use your information to fulfill orders, verify payments, send order confirmations via WhatsApp, and handle delivery logistics. We never sell your personal data.</p>
                    <h4 style={{ color: 'var(--fitti-text)', marginTop: '16px', marginBottom: '8px' }}>3. Data Storage</h4>
                    <p style={{ marginBottom: '12px' }}>Your profile data is stored securely using local storage and/or Supabase database systems. You can request deletion of your profile at any time by contacting hello@fitti.in.</p>
                  </>
                ) : (
                  <>
                    <p style={{ marginBottom: '12px' }}><strong>Effective Date:</strong> June 26, 2026</p>
                    <p style={{ marginBottom: '12px' }}>Welcome to FITTI. By subscribing to our breakfast delivery plans, you agree to comply with and be bound by the following terms and conditions.</p>
                    <h4 style={{ color: 'var(--fitti-text)', marginTop: '16px', marginBottom: '8px' }}>1. Delivery Services</h4>
                    <p style={{ marginBottom: '12px' }}>We deliver fresh high-protein breakfasts every morning between 6:00 AM and 9:00 AM in Bangalore, India. Deliveries are made to the address provided during checkout. Ensure delivery access is available during these hours.</p>
                    <h4 style={{ color: 'var(--fitti-text)', marginTop: '16px', marginBottom: '8px' }}>2. Payments and Cancellations</h4>
                    <p style={{ marginBottom: '12px' }}>Payments are made via UPI or online integrations. All transactions are final. You can pause or modify delivery dates by contacting our support team via WhatsApp at least 24 hours in advance.</p>
                    <h4 style={{ color: 'var(--fitti-text)', marginTop: '16px', marginBottom: '8px' }}>3. Food Safety</h4>
                    <p style={{ marginBottom: '12px' }}>Meals are prepared fresh daily and should be consumed immediately or stored in a refrigerator. FITTI is not liable for health issues arising from improper storage of delivered items.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
