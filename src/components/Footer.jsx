import './Footer.css';

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

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
              Healthy Breakfast. Fully Managed.
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
              <h4 className="footer-links-title">Contact</h4>
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="footer-link">WhatsApp</a>
              <a href="mailto:hello@fitti.in" className="footer-link">hello@fitti.in</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {currentYear} FITTI. Made with 💚 for healthier mornings.
          </p>
        </div>
      </div>
    </footer>
  );
}
