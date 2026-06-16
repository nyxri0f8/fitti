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
  const [submitError, setSubmitError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);

    if (form.paymentMethod === 'razorpay' && razorpayLoaded) {
      try {
        // Step 1: Create Order on backend
        const createOrderRes = await fetch('/api/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: finalTotal * 100, // in paise
            currency: 'INR',
            receipt: orderId,
          }),
        });

        if (!createOrderRes.ok) {
          const errData = await createOrderRes.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || 'Failed to create order on server');
        }

        const backendOrder = await createOrderRes.json();

        // Step 2: Open Razorpay modal with order_id
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
          amount: backendOrder.amount, // in paise
          currency: backendOrder.currency,
          name: 'FITTI Breakfast',
          description: `Plan Subscription · ${orderData.days} Days`,
          order_id: backendOrder.order_id,
          theme: {
            color: '#76b900' // FITTI Green Accent
          },
          prefill: {
            name: form.fullName,
            contact: form.phone,
          },
          handler: async function (response) {
            try {
              setIsSubmitting(true);
              setSubmitError('');

              // Step 3: Verify signature on backend
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (!verifyRes.ok) {
                const verifyErr = await verifyRes.json().catch(() => ({}));
                throw new Error(verifyErr.message || verifyErr.error || 'Payment verification failed');
              }

              // On success, finalize submission
              handleOrderSubmission(response.razorpay_payment_id);
            } catch (err) {
              console.error('Payment verification handler error:', err);
              setSubmitError(err.message || 'Payment verification failed. Please contact support.');
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              setSubmitError('Payment cancelled. Please try again.');
            }
          }
        };

        const rzp = new window.Razorpay(options);

        // Listen to payment.failed event as required
        rzp.on('payment.failed', function (response) {
          console.error('Payment failed:', response.error);
          setSubmitError(response.error.description || 'Payment failed. Please try again.');
          setIsSubmitting(false);
        });

        rzp.open();
      } catch (error) {
        console.error('Error in Razorpay integration:', error);
        setSubmitError(error.message || 'Failed to initiate secure checkout');
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
    setSubmitError('');
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

                <div className="checkout-payment-gateway-note text-secondary" style={{ fontSize: '0.8125rem', padding: 'var(--space-4)', border: '1px solid var(--fitti-border)', borderRadius: 'var(--radius-lg)', background: 'var(--fitti-green-5)', color: 'var(--fitti-text-secondary)', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--fitti-green-dark)', marginBottom: '8px' }}>
                    💳 Checkout with UPI, Card or NetBanking
                  </div>
                  Pay securely with Razorpay. Your subscription starts immediately after payment confirmation.
                </div>
              </div>
            </ScrollReveal>

            {/* Submit */}
            <ScrollReveal delay={0.35}>
              {submitError && (
                <div className="checkout-submit-error" style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: 'var(--space-4)',
                  textAlign: 'center'
                }}>
                  ⚠️ {submitError}
                </div>
              )}
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
                    Checkout · ₹{finalTotal}
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
