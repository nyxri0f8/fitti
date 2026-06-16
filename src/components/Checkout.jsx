import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { upiId } from '../data/products';
import ScrollReveal from './ScrollReveal';
import { dbService } from '../services/db';
import { sendOrderReceiptEmail } from '../services/resend';
import './Checkout.css';

export default function Checkout({ user, orderData, onOrderComplete, onBack }) {
  const [orderId] = useState(() => 'FITTI-' + Date.now().toString(36).toUpperCase());
  
  // Combine structured address fields for full address representation
  const getFullAddress = () => {
    if (!user?.house_no) return '';
    const parts = [
      user.house_no,
      user.street,
      user.locality,
      user.city,
      user.state
    ].filter(Boolean);
    return parts.join(', ');
  };

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone_number_1 || '',
    area: user?.area || '',
    pincode: user?.pincode || '',
    address: getFullAddress(),
    landmark: user?.locality || '',
    foodPreference: 'veg',
    notes: '',
    paymentMethod: 'razorpay',
    payerName: '',
    transactionId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Dynamic load of Razorpay Checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay SDK');
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        phone: user.phone_number_1 || prev.phone,
        area: user.area || prev.area,
        pincode: user.pincode || prev.pincode,
        address: user.house_no ? `${user.house_no}, ${user.street}, ${user.locality || ''}, ${user.city}, ${user.state}` : prev.address,
        landmark: user.locality || prev.landmark
      }));
    }
  }, [user]);

  // Birthday discount checker
  const isBirthday = () => {
    if (!user?.dob) return false;
    const dobParts = user.dob.split('-');
    if (dobParts.length < 3) return false;
    const dobMonth = parseInt(dobParts[1], 10);
    const dobDay = parseInt(dobParts[2], 10);
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth is 0-indexed
    const currentDay = today.getDate();
    
    return dobMonth === currentMonth && dobDay === currentDay;
  };

  const hasBirthdayDiscount = isBirthday() && !user?.birthday_discount_used;
  const finalTotal = hasBirthdayDiscount ? Math.round(orderData?.total * 0.5) : (orderData?.total || 0);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Name is required';
    if (!form.phone.trim() || form.phone.length < 10) errs.phone = 'Valid phone number required';
    if (!form.area.trim()) errs.area = 'Area is required';
    if (!form.pincode.trim() || form.pincode.length < 6) errs.pincode = 'Valid pincode required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (form.paymentMethod === 'manual-upi') {
      if (!form.payerName.trim()) errs.payerName = 'Name of the payer is required';
      if (!form.transactionId.trim()) errs.transactionId = 'Transaction ID or UTR is required';
    }
    return errs;
  };

  const handleOrderSubmission = async (paymentId) => {
    if (hasBirthdayDiscount) {
      try {
        await dbService.updateProfileFields(user.email, { birthday_discount_used: true });
        user.birthday_discount_used = true; // prevent re-triggering locally
      } catch (err) {
        console.warn('Failed to save birthday discount use status to database:', err);
      }
    }

    const order = {
      id: orderId,
      email: user?.email || null,
      ...form,
      transactionId: paymentId || form.transactionId,
      razorpayPaymentId: paymentId || null,
      ...orderData,
      total: finalTotal, // Use discounted price in invoice
      createdAt: new Date().toISOString(),
      paymentStatus: paymentId ? 'Payment Verified' : 'Payment Pending',
      orderStatus: 'New Order',
    };

    // Save to Supabase backend database
    try {
      await dbService.saveOrder(order);
    } catch (err) {
      console.warn('Error saving order to database:', err);
    }

    // Dispatch custom HTML order receipt email via Resend API
    if (user?.email) {
      sendOrderReceiptEmail(user.email, order).catch((err) => {
        console.warn('Failed to dispatch receipt email via Resend:', err);
      });
    }

    const orders = JSON.parse(localStorage.getItem('fitti-orders') || '[]');
    orders.push(order);
    localStorage.setItem('fitti-orders', JSON.stringify(orders));

    setIsSubmitting(false);
    onOrderComplete && onOrderComplete(order);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);

    if (form.paymentMethod === 'razorpay' && razorpayLoaded) {
      // Trigger Razorpay Checkout
      const options = {
        key: 'rzp_test_T2CP5qWnV0P6M6',
        amount: finalTotal * 100, // in paise
        currency: 'INR',
        name: 'FITTI Breakfast',
        description: `Plan Subscription · ${orderData.days} Days`,
        theme: {
          color: '#76b900' // FITTI Green Accent
        },
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        handler: function (response) {
          handleOrderSubmission(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error('Error opening Razorpay:', error);
        setIsSubmitting(false);
      }
    } else {
      // Manual UPI fallback flow
      setTimeout(() => {
        handleOrderSubmission(null);
      }, 1200);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const copyUPI = () => {
    navigator.clipboard.writeText('saravananvarun6-1@oksbi').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const upiUrl = `upi://pay?pa=saravananvarun6-1@oksbi&pn=Varun%20saravanan&am=${finalTotal}&cu=INR&tn=${orderId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return (
    <section className="section checkout-section" id="checkout">
      <div className="container">
        <ScrollReveal>
          <button className="checkout-back" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Builder
          </button>
        </ScrollReveal>

        <ScrollReveal>
          <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
            <h2>Checkout</h2>
            <p>Almost there! Fill in your delivery details.</p>
          </div>
        </ScrollReveal>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            {hasBirthdayDiscount && (
              <motion.div 
                className="birthday-card-bezel-wrapper"
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Floating Decorative Elements */}
                {/* Floating Bag 1 */}
                <motion.div
                  style={{ position: 'absolute', top: '10%', left: '8%', pointerEvents: 'none', opacity: 0.3 }}
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--fitti-peanut)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </motion.div>

                {/* Floating Balloon 1 */}
                <motion.div
                  style={{ position: 'absolute', bottom: '15%', right: '8%', pointerEvents: 'none', opacity: 0.25 }}
                  animate={{ y: [0, -12, 0], rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
                    <ellipse cx="14" cy="14" rx="12" ry="14" stroke="var(--fitti-peanut)" strokeWidth="1.5" />
                    <path d="M14 28v6M12 34h4" stroke="var(--fitti-peanut)" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M14 28l-2 2h4l-2-2z" fill="var(--fitti-peanut)" />
                  </svg>
                </motion.div>

                {/* Floating Sparkle 1 */}
                <motion.div
                  style={{ position: 'absolute', top: '15%', right: '15%', pointerEvents: 'none' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fitti-peanut)" strokeWidth="2">
                    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
                  </svg>
                </motion.div>

                {/* Floating Balloon 2 (Left bottom) */}
                <motion.div
                  style={{ position: 'absolute', bottom: '10%', left: '12%', pointerEvents: 'none', opacity: 0.2 }}
                  animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <svg width="22" height="30" viewBox="0 0 28 36" fill="none">
                    <ellipse cx="14" cy="14" rx="12" ry="14" stroke="var(--fitti-peanut)" strokeWidth="1.5" />
                    <path d="M14 28v6M12 34h4" stroke="var(--fitti-peanut)" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M14 28l-2 2h4l-2-2z" fill="var(--fitti-peanut)" />
                  </svg>
                </motion.div>

                {/* Inner Core Container */}
                <div className="birthday-card-inner">
                  {/* Eyebrow tag */}
                  <span 
                    className="eyebrow" 
                    style={{ 
                      marginBottom: 0, 
                      background: 'rgba(196, 144, 61, 0.08)', 
                      borderColor: 'rgba(196, 144, 61, 0.18)', 
                      color: 'var(--fitti-peanut)' 
                    }}
                  >
                    <span className="eyebrow-dot" style={{ backgroundColor: 'var(--fitti-peanut)' }}></span>
                    Official Birthday Reward
                  </span>

                  {/* Main Icon & Gift Centerpiece */}
                  <div style={{ position: 'relative', height: '84px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', width: '90px', height: '90px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(196, 144, 61, 0.15) 0%, rgba(196, 144, 61, 0) 70%)', filter: 'blur(4px)', zIndex: 0 }}></div>
                    
                    <motion.div
                      initial={{ scale: 0.9, rotate: -3 }}
                      animate={{ scale: [1, 1.05, 1], rotate: [-3, 3, -3] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      style={{ zIndex: 1 }}
                    >
                      <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="var(--fitti-peanut)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 9h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z" fill="rgba(196,144,61,0.02)"></path>
                        <path d="M4 9V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"></path>
                        <path d="M12 4v18" strokeDasharray="3 3"></path>
                        <path d="M12 9c1.5-3 4-3 4-1.5S14 9 12 9zm0 0c-1.5-3-4-3-4-1.5S10 9 12 9z" fill="rgba(196,144,61,0.1)"></path>
                      </svg>
                    </motion.div>
                  </div>

                  {/* Text Header & Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 className="font-accent">
                      Happy Birthday, {user?.name ? user.name.split(' ')[0] : 'Customer'}! 🎉
                    </h3>
                    <p 
                      style={{ 
                        color: 'var(--fitti-text-secondary)', 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        margin: 0, 
                        lineHeight: 1.5,
                        maxWidth: '380px'
                      }}
                    >
                      To celebrate your special day, we’ve applied an exclusive <strong style={{ color: 'var(--fitti-peanut)' }}>50% discount</strong> on your checkout. Enjoy your healthy high-protein meals!
                    </p>
                  </div>

                  {/* Micro highlight coupon badge */}
                  <div 
                    style={{ 
                      border: '1px dashed rgba(196, 144, 61, 0.3)',
                      background: 'rgba(196, 144, 61, 0.03)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-2) var(--space-4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--fitti-peanut)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}
                  >
                    <span>🎁 Code Applied: BD50PASS</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Order Review */}
            <ScrollReveal delay={0.1}>
              <div className="checkout-card">
                <h3 className="checkout-card-title">Your Order</h3>
                <div className="checkout-order-review">
                  {orderData?.products ? (
                    orderData.products.map(item => (
                      <div key={item.id} className="checkout-review-row">
                        <span>{item.name} <span className="text-muted">x{item.quantity}</span></span>
                        <span className="font-mono">₹{item.price * item.quantity * orderData.days}</span>
                      </div>
                    ))
                  ) : (
                    <div className="checkout-review-row">
                      <span>Product</span>
                      <span className="font-mono">{orderData?.product?.name}</span>
                    </div>
                  )}
                  <div className="checkout-review-row">
                    <span>Duration</span>
                    <span className="font-mono">{orderData?.days} Days</span>
                  </div>
                  {orderData?.proteinBoost && (
                    <div className="checkout-review-row">
                      <span>Protein Boost</span>
                      <span className="text-green">✓ Added</span>
                    </div>
                  )}
                  <div className="checkout-review-row">
                    <span>Delivery</span>
                    <span>{orderData?.deliverySlot?.label} · {orderData?.schedule || 'Consecutive'}</span>
                  </div>
                  <div className="divider"></div>
                  <div className="checkout-review-row checkout-review-total">
                    <span>Total</span>
                    <span className="price price-large">
                      {hasBirthdayDiscount && (
                        <span className="price-strike" style={{ marginRight: '8px', fontSize: '1rem', fontWeight: 400 }}>₹{orderData?.total}</span>
                      )}
                      ₹{finalTotal}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Customer Details */}
            <ScrollReveal delay={0.2}>
              <div className="checkout-card">
                <h3 className="checkout-card-title">Delivery Details</h3>

                <div className="checkout-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">Full Name *</label>
                    <input
                      id="fullName"
                      className="form-input"
                      type="text"
                      placeholder="Your full name"
                      value={form.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                    />
                    {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number *</label>
                    <input
                      id="phone"
                      className="form-input"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      maxLength={10}
                    />
                    {errors.phone && <span className="form-error">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="area">Area *</label>
                    <input
                      id="area"
                      className="form-input"
                      type="text"
                      placeholder="Your area / locality"
                      value={form.area}
                      onChange={(e) => handleChange('area', e.target.value)}
                    />
                    {errors.area && <span className="form-error">{errors.area}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="pincode">Pincode *</label>
                    <input
                      id="pincode"
                      className="form-input"
                      type="text"
                      placeholder="6-digit pincode"
                      value={form.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      maxLength={6}
                    />
                    {errors.pincode && <span className="form-error">{errors.pincode}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="address">Full Address *</label>
                  <textarea
                    id="address"
                    className="form-input form-textarea"
                    placeholder="House/Flat number, street, building"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="landmark">Landmark</label>
                  <input
                    id="landmark"
                    className="form-input"
                    type="text"
                    placeholder="Near a landmark (optional)"
                    value={form.landmark}
                    onChange={(e) => handleChange('landmark', e.target.value)}
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* Food Preference */}
            <ScrollReveal delay={0.25}>
              <div className="checkout-card">
                <h3 className="checkout-card-title">Food Preference</h3>
                <div className="chip-group">
                  {['veg', 'egg', 'non-veg'].map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      className={`chip ${form.foodPreference === pref ? 'active' : ''}`}
                      onClick={() => handleChange('foodPreference', pref)}
                    >
                      {pref === 'veg' && '🟢'} {pref === 'egg' && '🟡'} {pref === 'non-veg' && '🔴'}{' '}
                      {pref.charAt(0).toUpperCase() + pref.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>

                <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                  <label className="form-label" htmlFor="notes">Special Notes</label>
                  <textarea
                    id="notes"
                    className="form-input form-textarea"
                    placeholder="Any special instructions (optional)"
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* Payment */}
            <ScrollReveal delay={0.3}>
              <div className="checkout-card">
                <h3 className="checkout-card-title">Payment</h3>

                <div className="checkout-payment-amount">
                  <span>Amount to Pay</span>
                  <span className="price price-large">
                    {hasBirthdayDiscount && (
                      <span className="price-strike" style={{ marginRight: '8px', fontSize: '1.2rem', fontWeight: 400, textDecoration: 'line-through', color: 'var(--fitti-text-muted)' }}>₹{orderData?.total}</span>
                    )}
                    ₹{finalTotal}
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                  <label className="form-label">Payment Method</label>
                  <div className="chip-group" style={{ marginTop: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className={`chip ${form.paymentMethod === 'razorpay' ? 'active' : ''}`}
                      onClick={() => handleChange('paymentMethod', 'razorpay')}
                      style={{ fontSize: '0.8125rem', padding: 'var(--space-2) var(--space-4)' }}
                    >
                      💳 Razorpay (UPI, Card, NetBanking)
                    </button>
                    <button
                      type="button"
                      className={`chip ${form.paymentMethod === 'manual-upi' ? 'active' : ''}`}
                      onClick={() => handleChange('paymentMethod', 'manual-upi')}
                      style={{ fontSize: '0.8125rem', padding: 'var(--space-2) var(--space-4)' }}
                    >
                      📱 Manual UPI Transfer
                    </button>
                  </div>
                </div>

                {form.paymentMethod === 'razorpay' ? (
                  <div className="checkout-payment-gateway-note text-secondary" style={{ fontSize: '0.8125rem', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--fitti-border)', borderRadius: 'var(--radius-md)', background: 'var(--fitti-green-5)', color: 'var(--fitti-text-secondary)', lineHeight: '1.5' }}>
                    ⚡ **Instant Activation**: Pay securely with Razorpay using UPI, cards, net banking, or wallets. Your subscription starts immediately after payment confirmation.
                  </div>
                ) : (
                  <>
                    <div className="checkout-upi-qr-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', margin: 'var(--space-4) 0', padding: 'var(--space-4)', border: '1px solid var(--fitti-border)', borderRadius: 'var(--radius-lg)', background: 'var(--fitti-green-5)' }}>
                      <div className="checkout-upi-qr-header" style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--fitti-text)' }}>
                        Scan to Pay with GPay, PhonePe, Paytm
                      </div>
                      <div className="checkout-upi-qr-wrap" style={{ padding: 'var(--space-3)', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'inline-flex' }}>
                        <img 
                          src={qrCodeUrl} 
                          alt="UPI Payment QR Code" 
                          style={{ width: '180px', height: '180px', display: 'block' }} 
                        />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span className="checkout-upi-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', color: 'var(--fitti-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UPI ID</span>
                        <div className="checkout-upi-copy" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fitti-text)' }}>saravananvarun6-1@oksbi</span>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={copyUPI}>
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                      <label className="form-label" htmlFor="payerName">Name of the Payer *</label>
                      <input
                        id="payerName"
                        className="form-input"
                        type="text"
                        placeholder="Name of the bank account holder paying"
                        value={form.payerName}
                        onChange={(e) => handleChange('payerName', e.target.value)}
                      />
                      {errors.payerName && <span className="form-error">{errors.payerName}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="transactionId">Transaction ID / UTR *</label>
                      <input
                        id="transactionId"
                        className="form-input"
                        type="text"
                        placeholder="Enter 12-digit transaction ID"
                        value={form.transactionId}
                        onChange={(e) => handleChange('transactionId', e.target.value)}
                      />
                      {errors.transactionId && <span className="form-error">{errors.transactionId}</span>}
                      <p className="checkout-payment-hint">Enter your UPI transaction ID / UTR after completing the payment</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollReveal>

            {/* Submit */}
            <ScrollReveal delay={0.35}>
              <motion.button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="checkout-spinner"></span>
                ) : (
                  <>
                    {form.paymentMethod === 'razorpay' ? 'Pay Securely' : 'Place Order'} · ₹{finalTotal}
                    <span className="btn-icon">→</span>
                  </>
                )}
              </motion.button>
            </ScrollReveal>
          </form>
        </div>
      </div>
    </section>
  );
}
