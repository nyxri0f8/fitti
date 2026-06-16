import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { quotes } from '../data/quotes';
import './TicketView.css';

export default function TicketView({ user, onProceed }) {
  const [randomQuote, setRandomQuote] = useState('');
  const [ticketId] = useState(() => 'FT-' + Math.random().toString(36).substr(2, 9).toUpperCase());
  const [joinDate] = useState(() => new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  // Choose a random quote on load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Generate 80 simple confetti particles for the explosion
  const confettiArray = Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth - window.innerWidth / 2,
    y: Math.random() * -600 - 100,
    size: Math.random() * 8 + 6,
    color: ['#76b900', '#5a8f00', '#8ed100', '#FDFBF7', '#C4903D'][Math.floor(Math.random() * 5)],
    delay: Math.random() * 0.5,
    rotate: Math.random() * 360
  }));

  return (
    <div className="ticket-view-container">
      {/* Confetti Explosion */}
      <div className="confetti-holder">
        {confettiArray.map((particle) => (
          <motion.div
            key={particle.id}
            className="confetti-particle"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              position: 'absolute',
              top: '50%',
              left: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              rotate: particle.rotate + 720
            }}
            transition={{
              duration: 2.2,
              ease: 'easeOut',
              delay: particle.delay
            }}
          />
        ))}
      </div>

      <div className="ticket-success-message">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="success-icon-badge">🎉</div>
        </motion.div>
        <h2>Welcome to Fitti, {user?.name}!</h2>
        <p>Your membership details have been configured. Here is your official welcome pass:</p>
      </div>

      {/* Ticket Dispenser Slot Animation */}
      <div className="dispenser-machine">
        <div className="dispenser-slot"></div>
        
        <motion.div 
          className="welcome-ticket"
          id="printable-ticket"
          initial={{ y: -300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Left notches */}
          <div className="ticket-notch ticket-notch-left-top"></div>
          <div className="ticket-notch ticket-notch-left-bottom"></div>
          {/* Right notches */}
          <div className="ticket-notch ticket-notch-right-top"></div>
          <div className="ticket-notch ticket-notch-right-bottom"></div>

          {/* Ticket Header */}
          <div className="ticket-header">
            <div className="ticket-logo">
              Fitti<span className="logo-dot-green">.</span>
            </div>
            <div className="ticket-type-badge">OFFICIAL WELCOME PASS</div>
          </div>

          <div className="ticket-body">
            <div className="ticket-user-section">
              <div className="ticket-info-row">
                <span className="ticket-info-label">Member Name</span>
                <span className="ticket-info-value">{user?.name}</span>
              </div>
              <div className="ticket-info-row">
                <span className="ticket-info-label">Email Account</span>
                <span className="ticket-info-value">{user?.email}</span>
              </div>
              <div className="ticket-info-grid">
                <div className="ticket-info-row">
                  <span className="ticket-info-label">Primary Phone</span>
                  <span className="ticket-info-value">{user?.phone_number_1}</span>
                </div>
                <div className="ticket-info-row">
                  <span className="ticket-info-label">Date of Joining</span>
                  <span className="ticket-info-value">{joinDate}</span>
                </div>
              </div>
            </div>

            <div className="ticket-divider">
              <div className="ticket-divider-line"></div>
            </div>

            {/* Motivational Quote Section */}
            <div className="ticket-quote-section">
              <span className="quote-header">TODAY'S MORNING QUOTE</span>
              <p className="quote-text">"{randomQuote}"</p>
            </div>

            {/* Ticket Footer / Barcode details */}
            <div className="ticket-footer">
              <div className="ticket-barcode-wrap">
                <div className="barcode-line" style={{ height: '30px', width: '2px', background: '#1a1a1a', margin: '0 1px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '3px', background: '#1a1a1a', margin: '0 2px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '1px', background: '#1a1a1a', margin: '0 1px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '4px', background: '#1a1a1a', margin: '0 2px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '2px', background: '#1a1a1a', margin: '0 1px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '1px', background: '#1a1a1a', margin: '0 1px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '3px', background: '#1a1a1a', margin: '0 2px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '2px', background: '#1a1a1a', margin: '0 1px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '4px', background: '#1a1a1a', margin: '0 1px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '1px', background: '#1a1a1a', margin: '0 2px' }}></div>
                <div className="barcode-line" style={{ height: '30px', width: '2px', background: '#1a1a1a', margin: '0 1px' }}></div>
              </div>
              <span className="ticket-id-text">{ticketId}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="ticket-actions no-print">
        <button className="btn btn-secondary btn-lg" onClick={handlePrint}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print / Save Ticket
        </button>

        <button className="btn btn-primary btn-lg" onClick={onProceed}>
          Proceed to Order Food
          <span className="btn-icon">→</span>
        </button>
      </div>
    </div>
  );
}
