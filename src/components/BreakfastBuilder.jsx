import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { products, deliverySlots, scheduleOptions, dayPresets, proteinBoostPrice } from '../data/products';
import ScrollReveal from './ScrollReveal';
import './BreakfastBuilder.css';

export default function BreakfastBuilder({ productToAdd, onProductAddedProcessed, onProceedToCheckout }) {
  const [selectedProducts, setSelectedProducts] = useState({
    [products[0].id]: 1
  });
  const [days, setDays] = useState(5);
  const [proteinBoost, setProteinBoost] = useState(false);
  const [schedule, setSchedule] = useState('consecutive');
  const [deliverySlot, setDeliverySlot] = useState(deliverySlots[1].id);
  const [selectedCustomDays, setSelectedCustomDays] = useState(['Mon', 'Wed', 'Fri']);

  const handleToggleCustomDay = (day) => {
    setSelectedCustomDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      }
      return [...prev, day];
    });
  };

  // Sync products added from the ProductShowcase section
  useEffect(() => {
    if (productToAdd) {
      setSelectedProducts(prev => {
        const currentQty = prev[productToAdd.id] || 0;
        return {
          ...prev,
          [productToAdd.id]: currentQty + 1
        };
      });
      onProductAddedProcessed?.();
    }
  }, [productToAdd, onProductAddedProcessed]);

  const handleQuantityChange = (productId, change) => {
    setSelectedProducts(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      const next = { ...prev };
      if (newQty === 0) {
        delete next[productId];
      } else {
        next[productId] = newQty;
      }
      return next;
    });
  };

  const handleCardClick = (productId) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const selectedProductList = useMemo(() => {
    return products
      .filter(p => selectedProducts[p.id] > 0)
      .map(p => ({
        ...p,
        quantity: selectedProducts[p.id]
      }));
  }, [selectedProducts]);

  const selectedSmoothies = useMemo(() => {
    return selectedProductList.filter(p => p.category === 'smoothie');
  }, [selectedProductList]);

  const totalSmoothieQty = useMemo(() => {
    return selectedSmoothies.reduce((sum, p) => sum + p.quantity, 0);
  }, [selectedSmoothies]);

  const totalItemsCount = useMemo(() => {
    return selectedProductList.reduce((sum, p) => sum + p.quantity, 0);
  }, [selectedProductList]);

  const canAddProteinBoost = selectedSmoothies.length > 0;

  const orderSummary = useMemo(() => {
    const basePricePerDay = selectedProductList.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const basePrice = basePricePerDay * days;
    const boostPrice = (proteinBoost && canAddProteinBoost) ? proteinBoostPrice * totalSmoothieQty * days : 0;
    const total = basePrice + boostPrice;
    const pricePerDay = basePricePerDay + ((proteinBoost && canAddProteinBoost) ? proteinBoostPrice * totalSmoothieQty : 0);
    return { basePricePerDay, basePrice, boostPrice, total, pricePerDay };
  }, [selectedProductList, days, proteinBoost, canAddProteinBoost, totalSmoothieQty]);

  const handleProceed = () => {
    if (selectedProductList.length === 0) return;
    onProceedToCheckout && onProceedToCheckout({
      products: selectedProductList,
      days,
      proteinBoost: proteinBoost && canAddProteinBoost,
      schedule,
      customDeliveryDays: schedule === 'custom' ? selectedCustomDays : null,
      deliverySlot: deliverySlots.find(s => s.id === deliverySlot),
      total: orderSummary.total,
      pricePerDay: orderSummary.pricePerDay,
    });
  };

  const categories = [
    { id: 'smoothie', label: 'Smoothies' },
    { id: 'bowl', label: 'Breakfast Bowls' },
    { id: 'combo', label: 'Combos' }
  ];

  return (
    <section className="section builder-section" id="breakfast-builder">
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div className="eyebrow" style={{ display: 'inline-flex' }}>
              <span className="eyebrow-dot"></span>
              Build Your Plan
            </div>
            <h2>Design Your <span className="text-green">Morning</span></h2>
            <p>Customize your breakfast plan in under 60 seconds.</p>
          </div>
        </ScrollReveal>

        <div className="builder-layout">
          <div className="builder-form">
            {/* Step 1: Product Selection */}
            <ScrollReveal delay={0.1}>
              <div className="builder-step">
                <div className="builder-step-header">
                  <span className="builder-step-num">1</span>
                  <h3>Choose Your Breakfast</h3>
                </div>

                <div className="builder-menu">
                  {categories.map((cat) => {
                    const catProducts = products.filter(p => p.category === cat.id);
                    if (catProducts.length === 0) return null;
                    return (
                      <div key={cat.id} className="builder-category-group">
                        <h4 className="builder-category-title">{cat.label}</h4>
                        <div className="builder-products">
                          {catProducts.map((product) => {
                            const quantity = selectedProducts[product.id] || 0;
                            const isActive = quantity > 0;
                            return (
                              <motion.div
                                key={product.id}
                                className={`builder-product-btn ${isActive ? 'active' : ''}`}
                                onClick={() => handleCardClick(product.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleCardClick(product.id);
                                  }
                                }}
                                whileTap={{ scale: 0.98 }}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="builder-product-dot" style={{ background: product.color }}></div>
                                <div className="builder-product-info">
                                  <span className="builder-product-name">{product.shortName}</span>
                                  <span className="builder-product-meta">{product.protein} · ₹{product.price}/day</span>
                                </div>
                                {isActive ? (
                                  <div className="builder-product-qty-control" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className="qty-btn-sm"
                                      onClick={() => handleQuantityChange(product.id, -1)}
                                      aria-label="Decrease quantity"
                                    >
                                      −
                                    </button>
                                    <span className="qty-value-sm">{quantity}</span>
                                    <button
                                      type="button"
                                      className="qty-btn-sm"
                                      onClick={() => handleQuantityChange(product.id, 1)}
                                      aria-label="Increase quantity"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <div className="builder-product-add-action">
                                    <span className="builder-product-add-txt">Add</span>
                                    <div className="builder-product-add-icon">
                                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>

            {/* Step 2: Number of Mornings */}
            <ScrollReveal delay={0.2}>
              <div className="builder-step">
                <div className="builder-step-header">
                  <span className="builder-step-num">2</span>
                  <h3>Number of Mornings</h3>
                </div>

                <div className="builder-days-presets">
                  {dayPresets.map((preset) => (
                    <button
                      key={preset}
                      className={`chip ${days === preset ? 'active' : ''}`}
                      onClick={() => setDays(preset)}
                    >
                      {preset} {preset === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>

                <div className="builder-qty-row">
                  <div className="qty-selector">
                    <button className="qty-btn" onClick={() => setDays(Math.max(1, days - 1))} aria-label="Decrease days">−</button>
                    <span className="qty-value">{days}</span>
                    <button className="qty-btn" onClick={() => setDays(Math.min(30, days + 1))} aria-label="Increase days">+</button>
                  </div>
                  <span className="builder-days-label">
                    {days} Healthy {days === 1 ? 'Morning' : 'Mornings'}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Step 3: Protein Boost */}
            <ScrollReveal delay={0.3}>
              <div className="builder-step">
                <div className="builder-step-header">
                  <span className="builder-step-num">3</span>
                  <h3>Protein Boost</h3>
                </div>

                <div
                  className={`toggle-wrap ${proteinBoost && canAddProteinBoost ? 'active' : ''} ${!canAddProteinBoost ? 'disabled' : ''}`}
                  onClick={() => canAddProteinBoost && setProteinBoost(!proteinBoost)}
                  role="button"
                  tabIndex={0}
                  aria-label="Toggle protein boost"
                >
                  <div className="toggle-info">
                    <span className="toggle-title">Add Protein Boost</span>
                    <span className="toggle-desc">
                      {canAddProteinBoost
                        ? `+₹${proteinBoostPrice}/day per smoothie · Adds whey protein (~30-35g total)`
                        : 'Available only when smoothies are selected'}
                    </span>
                  </div>
                  <div className={`toggle-track ${proteinBoost && canAddProteinBoost ? 'active' : ''}`}>
                    <div className="toggle-thumb"></div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Step 4: Delivery Schedule */}
            <ScrollReveal delay={0.35}>
              <div className="builder-step">
                <div className="builder-step-header">
                  <span className="builder-step-num">4</span>
                  <h3>Delivery Schedule</h3>
                </div>
                <div className="builder-schedule-options">
                  {scheduleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      className={`builder-schedule-btn ${schedule === opt.id ? 'active' : ''}`}
                      onClick={() => setSchedule(opt.id)}
                    >
                      <span className="builder-schedule-label">{opt.label}</span>
                      <span className="builder-schedule-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {schedule === 'custom' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ 
                        marginTop: 'var(--space-4)', 
                        padding: 'var(--space-4)', 
                        border: '1px solid var(--fitti-border)', 
                        borderRadius: 'var(--radius-lg)', 
                        background: 'var(--fitti-green-5)',
                        overflow: 'hidden'
                      }}
                    >
                      <span className="form-label" style={{ marginBottom: 'var(--space-2)', fontSize: '0.8125rem' }}>Select Custom Delivery Days</span>
                      <div className="chip-group" style={{ marginTop: 'var(--space-2)', display: 'flex', gap: '6px' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                          const isSelected = selectedCustomDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              className={`chip ${isSelected ? 'active' : ''}`}
                              onClick={() => handleToggleCustomDay(day)}
                              style={{ 
                                minWidth: '42px', 
                                padding: '0 8px', 
                                borderRadius: '50%', 
                                height: '42px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: 'var(--space-3)', margin: 'var(--space-3) 0 0 0', lineHeight: 1.4 }}>
                        * Deliveries will be scheduled only on selected days until your {days} plan days are completed.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>

            {/* Step 5: Delivery Slot */}
            <ScrollReveal delay={0.4}>
              <div className="builder-step">
                <div className="builder-step-header">
                  <span className="builder-step-num">5</span>
                  <h3>Delivery Slot</h3>
                </div>
                <div className="chip-group">
                  {deliverySlots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`chip ${deliverySlot === slot.id ? 'active' : ''}`}
                      onClick={() => setDeliverySlot(slot.id)}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Live Order Summary */}
          <div className="builder-summary-wrap">
            <ScrollReveal delay={0.2} animation="slideInRight">
              <div className="builder-summary glass-panel">
                <h3 className="builder-summary-title">Order Summary</h3>

                {selectedProductList.length === 0 ? (
                  <div className="builder-summary-empty text-muted">
                    Select one or more breakfasts to build your plan.
                  </div>
                ) : (
                  <div className="builder-summary-products-list">
                    {selectedProductList.map(item => (
                      <div key={item.id} className="builder-summary-product" style={{ marginBottom: 'var(--space-3)' }}>
                        <div className="builder-summary-dot" style={{ background: item.color }}></div>
                        <div style={{ flex: 1 }}>
                          <span className="builder-summary-name">
                            {item.shortName} <span className="text-muted">x{item.quantity}</span>
                          </span>
                          <span className="builder-summary-meta">{item.protein} Protein · ₹{item.price}/day</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="divider"></div>

                <div className="builder-summary-details">
                  <div className="builder-summary-row">
                    <span>Duration</span>
                    <span className="font-mono">{days} {days === 1 ? 'Day' : 'Days'}</span>
                  </div>
                  <div className="builder-summary-row">
                    <span>Base Price</span>
                    <span className="font-mono">
                      ₹{orderSummary.basePricePerDay}/day × {days} = ₹{orderSummary.basePrice}
                    </span>
                  </div>

                  <AnimatePresence>
                    {proteinBoost && canAddProteinBoost && (
                      <motion.div
                        className="builder-summary-row"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span>Protein Boost</span>
                        <span className="font-mono">
                          +₹{proteinBoostPrice} × {totalSmoothieQty} × {days} = ₹{orderSummary.boostPrice}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="builder-summary-row">
                    <span>Schedule</span>
                    <span>
                      {scheduleOptions.find(s => s.id === schedule)?.label}
                      {schedule === 'custom' && ` (${selectedCustomDays.join(', ')})`}
                    </span>
                  </div>
                  <div className="builder-summary-row">
                    <span>Delivery Slot</span>
                    <span>{deliverySlots.find(s => s.id === deliverySlot)?.label}</span>
                  </div>
                </div>

                <div className="divider"></div>

                <div className="builder-summary-total">
                  <span>Total</span>
                  <motion.span
                    className="price price-large"
                    key={orderSummary.total}
                    initial={{ scale: 1.1, color: '#76b900' }}
                    animate={{ scale: 1, color: '#1a1a1a' }}
                    transition={{ duration: 0.3 }}
                  >
                    ₹{orderSummary.total}
                  </motion.span>
                </div>

                <div className="builder-summary-perday">
                  <span className="font-mono">₹{orderSummary.pricePerDay}/day</span>
                </div>

                <motion.button
                  className="btn btn-primary btn-lg w-full"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleProceed}
                  disabled={selectedProductList.length === 0}
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  Proceed to Checkout
                  <span className="btn-icon">→</span>
                </motion.button>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Mobile Sticky Summary */}
        <div className="builder-mobile-sticky">
          <div className="builder-mobile-sticky-inner">
            <div className="builder-mobile-sticky-info">
              {selectedProductList.length === 0 ? (
                <span className="builder-mobile-sticky-product text-muted">Select breakfast to start</span>
              ) : (
                <>
                  <span className="builder-mobile-sticky-product">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} · {days}d
                  </span>
                  <span className="price price-large">₹{orderSummary.total}</span>
                </>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleProceed}
              disabled={selectedProductList.length === 0}
            >
              Checkout →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
