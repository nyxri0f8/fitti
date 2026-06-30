import { useEffect } from 'react';
import { motion } from 'framer-motion';
import './OrderConfirmation.css';

export default function OrderConfirmation({ order, onBackToHome }) {
  const targetWhatsappNumber = '919092184238'; // Updated business WhatsApp number

  const productSummaryText = order?.products
    ? order.products.map(p => `- ${p.name} (x${p.quantity})`).join('\n')
    : `- ${order?.product?.name || ''}`;

  const payerNameText = order?.payerName ? `Payer Name: ${order.payerName}\n` : '';

  const paymentDetailsText = order?.razorpayPaymentId
    ? `Razorpay Payment ID: ${order.razorpayPaymentId}`
    : `Transaction/UTR ID: ${order?.transactionId || ''}`;

  const whatsappMessage = encodeURIComponent(
    `Hi FITTI team,\n\nI have placed an order on the FITTI website.\n\nOrder ID: ${order?.id}\n\nProducts:\n${productSummaryText}\n\nDuration: ${order?.days} Days\nTotal: ₹${order?.total}\n${payerNameText}${paymentDetailsText}\n\nPlease confirm my breakfast delivery schedule.`
  );

  const whatsappUrl = `https://wa.me/${targetWhatsappNumber}?text=${whatsappMessage}`;

  useEffect(() => {
    // Auto redirect to WhatsApp after 3.5 seconds
    const timer = setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 3500);
    return () => clearTimeout(timer);
  }, [whatsappUrl]);

  // Generates and downloads a custom high-fidelity PNG shop receipt
  const downloadReceipt = () => {
    if (!order) return;

    const itemsCount = order.products ? order.products.length : 1;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = 400;
    const headerHeight = 180;
    const itemsHeight = itemsCount * 35;
    const footerHeight = order.payerName ? 260 : 240;
    canvas.height = headerHeight + itemsHeight + footerHeight;

    // 1. Draw solid background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw saw-tooth edges (top & bottom)
    const drawSawtooth = (y, isTop) => {
      ctx.fillStyle = '#F9F8F3'; // Matches page cream background
      const toothWidth = 12;
      const toothHeight = 6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= canvas.width; x += toothWidth) {
        if (isTop) {
          ctx.lineTo(x + toothWidth / 2, y + toothHeight);
          ctx.lineTo(x + toothWidth, y);
        } else {
          ctx.lineTo(x + toothWidth / 2, y - toothHeight);
          ctx.lineTo(x + toothWidth, y);
        }
      }
      ctx.lineTo(canvas.width, isTop ? 0 : canvas.height);
      ctx.lineTo(0, isTop ? 0 : canvas.height);
      ctx.closePath();
      ctx.fill();
    };
    drawSawtooth(0, true);
    drawSawtooth(canvas.height, false);

    // 3. Draw text content
    ctx.fillStyle = '#111111'; // Crisp near-black text
    
    // Title
    ctx.font = 'bold 28px "Outfit", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FITTI', canvas.width / 2, 60);

    ctx.font = 'italic 12px "Playfair Display", serif';
    ctx.fillText('Fitness. Fully Managed.', canvas.width / 2, 80);

    // Metadata
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`ORDER ID: ${order.id}`, 30, 115);
    ctx.fillText(`DATE: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`, 30, 130);
    ctx.fillText(`TIME: ${new Date(order.createdAt || Date.now()).toLocaleTimeString()}`, 30, 145);

    // Divider
    ctx.fillText('------------------------------------------', 30, 165);

    let currentY = 185;

    // Table Header
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('ITEMS', 30, currentY);
    ctx.textAlign = 'right';
    ctx.fillText('TOTAL', canvas.width - 30, currentY);
    ctx.textAlign = 'left';

    currentY += 20;
    ctx.fillText('------------------------------------------', 30, currentY);
    currentY += 20;

    // Map ordered products
    ctx.font = '12px "JetBrains Mono", monospace';
    if (order.products) {
      order.products.forEach(item => {
        const qtyText = `${item.shortName} x${item.quantity}`;
        const itemTotal = `₹${item.price * item.quantity * order.days}`;
        ctx.fillText(qtyText, 30, currentY);
        ctx.textAlign = 'right';
        ctx.fillText(itemTotal, canvas.width - 30, currentY);
        ctx.textAlign = 'left';
        currentY += 25;
      });
    } else if (order.product) {
      const qtyText = `${order.product.name} x1`;
      const itemTotal = `₹${order.product.price * order.days}`;
      ctx.fillText(qtyText, 30, currentY);
      ctx.textAlign = 'right';
      ctx.fillText(itemTotal, canvas.width - 30, currentY);
      ctx.textAlign = 'left';
      currentY += 25;
    }

    ctx.fillText('------------------------------------------', 30, currentY);
    currentY += 20;

    // Duration details
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`DURATION: ${order.days} Days`, 30, currentY);
    currentY += 15;
    ctx.fillText(`SCHEDULE: ${order.schedule ? (order.schedule.charAt(0).toUpperCase() + order.schedule.slice(1)) : 'Consecutive'}`, 30, currentY);
    currentY += 15;
    ctx.fillText(`DELIVERY: ${order.deliverySlot?.label || ''}`, 30, currentY);
    currentY += 15;
    if (order.proteinBoost) {
      ctx.fillText('PROTEIN BOOST: Yes (Added)', 30, currentY);
      currentY += 15;
    }
    if (order.payerName) {
      ctx.fillText(`PAYER: ${order.payerName}`, 30, currentY);
      currentY += 15;
    }
    
    const referenceText = order.razorpayPaymentId 
      ? `RZP ID: ${order.razorpayPaymentId}`
      : `UTR ID: ${order.transactionId || 'Pending'}`;
    ctx.fillText(referenceText, 30, currentY);
    currentY += 15;

    ctx.fillText('------------------------------------------', 30, currentY);
    currentY += 20;

    // Total Paid row
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText('GRAND TOTAL', 30, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(`₹${order.total}`, canvas.width - 30, currentY);
    ctx.textAlign = 'left';
    currentY += 30;

    // Barcode lines
    ctx.textAlign = 'center';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText('||||| | |||| ||| || | |||| ||', canvas.width / 2, currentY);
    currentY += 15;
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('THANK YOU FOR UPGRADING YOUR MORNING', canvas.width / 2, currentY);

    // Download PNG file
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `fitti-receipt-${order.id}.png`;
    link.click();
  };

  return (
    <section className="confirmation-section">
      <div className="container">
        <motion.div
          className="confirmation-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Success Checkmark Animation */}
          <motion.div
            className="confirmation-check-wrap"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <svg className="confirmation-check-svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#76b900" strokeWidth="3" opacity="0.2"/>
              <circle cx="40" cy="40" r="36" stroke="#76b900" strokeWidth="3"
                strokeDasharray="226"
                strokeDashoffset="226"
                style={{ animation: 'drawCircle 0.6s 0.3s ease forwards' }}
              />
              <path
                d="M26 40l10 10 18-20"
                stroke="#76b900"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="60"
                strokeDashoffset="60"
                style={{ animation: 'drawCheck 0.4s 0.8s ease forwards' }}
              />
            </svg>
          </motion.div>

          <motion.h2
            className="confirmation-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Order Received!
          </motion.h2>

          <motion.p
            className="confirmation-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            Your FITTI breakfast plan has been received.
            <br />
            Our team will confirm your schedule shortly.
          </motion.p>

          {order && (
            <div className="receipt-printer-container">
              {/* Receipt Slot opening of billing machine */}
              <div className="printer-slot">
                <div className="printer-slot-opening"></div>
              </div>

              {/* Animated Receipt paper */}
              <motion.div
                className="receipt-paper"
                initial={{ height: 0, opacity: 0, scaleY: 0 }}
                animate={{ height: 'auto', opacity: 1, scaleY: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
              >
                {/* Sawtooth Torn Edge Top */}
                <div className="receipt-torn-edge top"></div>

                {/* Receipt Content */}
                <div className="receipt-header">
                  <span className="receipt-logo">FITTI</span>
                  <span className="receipt-tagline">Fitness. Fully Managed.</span>
                  
                  <div className="receipt-metadata">
                    <div>ORDER ID: <span className="font-mono" style={{ fontWeight: 600 }}>{order.id}</span></div>
                    <div>DATE: {new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
                    <div>TIME: {new Date(order.createdAt || Date.now()).toLocaleTimeString()}</div>
                  </div>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-title-row">
                  <span>ITEMS</span>
                  <span>TOTAL</span>
                </div>

                <div className="receipt-divider" style={{ margin: '4px 0' }}></div>

                <div className="receipt-items-list">
                  {order.products ? (
                    order.products.map(p => (
                      <div key={p.id} className="receipt-item-row">
                        <span className="receipt-item-name">{p.name} <span className="text-muted">x{p.quantity}</span></span>
                        <span className="receipt-item-price">₹{p.price * p.quantity * order.days}</span>
                      </div>
                    ))
                  ) : (
                    <div className="receipt-item-row">
                      <span className="receipt-item-name">{order.product?.name} <span className="text-muted">x1</span></span>
                      <span className="receipt-item-price">₹{(order.product?.price || 0) * order.days}</span>
                    </div>
                  )}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-details-list">
                  <div className="receipt-detail-row">
                    <span>Duration</span>
                    <span>{order.days} Days</span>
                  </div>
                  <div className="receipt-detail-row">
                    <span>Delivery</span>
                    <span>{order.deliverySlot?.label}</span>
                  </div>
                  <div className="receipt-detail-row">
                    <span>Payment Status</span>
                    <span style={{ color: order.paymentStatus === 'Payment Verified' ? '#76b900' : 'inherit', fontWeight: 600 }}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  {order.payerName && (
                    <div className="receipt-detail-row">
                      <span>Payer Name</span>
                      <span>{order.payerName}</span>
                    </div>
                  )}
                  {order.razorpayPaymentId ? (
                    <div className="receipt-detail-row">
                      <span>Razorpay ID</span>
                      <span className="font-mono" style={{ fontSize: '0.7rem' }}>{order.razorpayPaymentId}</span>
                    </div>
                  ) : (
                    <div className="receipt-detail-row">
                      <span>Transaction ID</span>
                      <span className="font-mono" style={{ fontSize: '0.7rem' }}>{order.transactionId || 'Pending'}</span>
                    </div>
                  )}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-total-row">
                  <span>GRAND TOTAL</span>
                  <span className="price">₹{order.total}</span>
                </div>

                <div className="receipt-barcode">
                  ||||| | |||| ||| || | |||| ||
                </div>
                <div className="receipt-footer-text">
                  Thank you for upgrading your morning
                </div>

                {/* Sawtooth Torn Edge Bottom */}
                <div className="receipt-torn-edge bottom"></div>
              </motion.div>
            </div>
          )}

          <motion.div
            className="confirmation-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 3 1.1 4.3L1.5 18.5l4.3-1.1C7 18.1 8.5 18.5 10 18.5c4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 8.5c0-.6.4-1 1-1h.5c.3 0 .5.1.7.3l.8 1c.2.2.2.5 0 .7l-.3.4c.4.8 1 1.4 1.8 1.8l.4-.3c.2-.2.5-.2.7 0l1 .8c.2.2.3.4.3.7V13c0 .6-.4 1-1 1-3.3 0-6-2.7-6-6z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Confirm on WhatsApp
            </a>

            <button className="btn btn-secondary btn-lg" onClick={downloadReceipt}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Bill
            </button>

            <button className="btn btn-secondary btn-lg" onClick={onBackToHome}>
              Back to Home
            </button>
          </motion.div>

          <motion.p
            className="confirmation-redirect-note"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            Redirecting to WhatsApp in a moment...
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
