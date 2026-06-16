import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '../services/db';
import './ProfileView.css';

export default function ProfileView({ user, onClose, onProfileUpdate, onLogout }) {
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    dob: user?.dob || '',
    phone_number_1: user?.phone_number_1 || '',
    phone_number_2: user?.phone_number_2 || '',
    house_no: user?.house_no || '',
    street: user?.street || '',
    area: user?.area || '',
    locality: user?.locality || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    state: user?.state || ''
  });
  
  // Form error
  const [error, setError] = useState('');

  // Orders and Tab history states
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders' && user?.email) {
      setLoadingOrders(true);
      dbService.getUserOrders(user.email).then(result => {
        if (result.success && result.data) {
          setOrders(result.data);
        }
        setLoadingOrders(false);
      });
    }
  }, [activeTab, user?.email]);

  const handleEditClick = () => {
    setFormData({
      name: user?.name || '',
      age: user?.age || '',
      dob: user?.dob || '',
      phone_number_1: user?.phone_number_1 || '',
      phone_number_2: user?.phone_number_2 || '',
      house_no: user?.house_no || '',
      street: user?.street || '',
      area: user?.area || '',
      locality: user?.locality || '',
      city: user?.city || '',
      pincode: user?.pincode || '',
      state: user?.state || ''
    });
    setMode('edit');
    setError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.name.trim()) return setError('Name is required');
    if (!formData.age || parseInt(formData.age, 10) <= 0) return setError('Please enter a valid age');
    if (!formData.dob) return setError('Date of Birth is required');
    if (!formData.phone_number_1.trim() || formData.phone_number_1.length < 10) {
      return setError('Please enter a valid 10-digit primary phone number');
    }
    if (!formData.house_no.trim()) return setError('House No is required');
    if (!formData.street.trim()) return setError('Street name is required');
    if (!formData.area.trim()) return setError('Area is required');
    if (!formData.city.trim()) return setError('City is required');
    if (!formData.pincode.trim() || formData.pincode.length < 6) {
      return setError('Please enter a valid 6-digit pincode');
    }
    if (!formData.state.trim()) return setError('State is required');

    // Just save profile updates directly
    await saveProfileChanges(formData);
  };

  const saveProfileChanges = async (updatedData) => {
    try {
      const result = await dbService.updateProfileFields(user.email, updatedData);
      if (result.success) {
        onProfileUpdate && onProfileUpdate(result.data);
        setMode('view');
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while saving.');
    }
  };

  // Helper to format full address for view mode
  const getFormattedAddress = () => {
    const parts = [
      user?.house_no,
      user?.street,
      user?.locality,
      user?.area,
      user?.city,
      user?.state
    ].filter(Boolean);
    
    return parts.join(', ') + (user?.pincode ? ` - ${user.pincode}` : '');
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <motion.div
        className="profile-modal glass-panel"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        style={{ maxWidth: '640px' }}
      >
        <button className="profile-close-btn" onClick={onClose} aria-label="Close Profile">
          ×
        </button>

        <AnimatePresence mode="wait">
          {mode === 'view' && (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="profile-modal-header">
                <div className="profile-avatar-large">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <h3>{user?.name}</h3>
                <span className="profile-badge">FITTI MEMBER</span>
              </div>

              {/* Tab Selector */}
              <div 
                className="profile-tabs"
                style={{ 
                  display: 'flex', 
                  borderBottom: '1px solid var(--fitti-border)', 
                  marginBottom: 'var(--space-5)', 
                  gap: 'var(--space-4)',
                  paddingTop: 'var(--space-2)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  style={{
                    padding: 'var(--space-2) 0',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: activeTab === 'profile' ? 'var(--fitti-green)' : 'var(--fitti-text-secondary)',
                    borderBottom: activeTab === 'profile' ? '2.5px solid var(--fitti-green)' : '2.5px solid transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  style={{
                    padding: 'var(--space-2) 0',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: activeTab === 'orders' ? 'var(--fitti-green)' : 'var(--fitti-text-secondary)',
                    borderBottom: activeTab === 'orders' ? '2.5px solid var(--fitti-green)' : '2.5px solid transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  Previous Orders
                </button>
              </div>

              {activeTab === 'profile' ? (
                <>
                  <div className="profile-details-list">
                    <div className="profile-detail-item">
                      <span className="detail-label">Email Address</span>
                      <span className="detail-value">{user?.email}</span>
                    </div>
                    <div className="profile-detail-grid">
                      <div className="profile-detail-item">
                        <span className="detail-label">Age</span>
                        <span className="detail-value">{user?.age ? `${user.age} years` : 'Not set'}</span>
                      </div>
                      <div className="profile-detail-item">
                        <span className="detail-label">Date of Birth</span>
                        <span className="detail-value">{user?.dob || 'Not set'}</span>
                      </div>
                    </div>
                    <div className="profile-detail-grid">
                      <div className="profile-detail-item">
                        <span className="detail-label">Primary Phone (Phone 1)</span>
                        <span className="detail-value">{user?.phone_number_1 || 'Not set'}</span>
                      </div>
                      <div className="profile-detail-item">
                        <span className="detail-label">Secondary Phone (Phone 2)</span>
                        <span className="detail-value">{user?.phone_number_2 || 'Not set'}</span>
                      </div>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-label">Delivery Address</span>
                      <span className="detail-value address-value">
                        {user?.house_no ? getFormattedAddress() : 'Not set'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button className="btn btn-primary w-full" onClick={handleEditClick}>
                      Edit Profile Details
                    </button>
                    <button 
                      className="btn btn-secondary w-full" 
                      onClick={onLogout} 
                      style={{ 
                        borderColor: 'rgba(239, 68, 68, 0.25)', 
                        color: '#ef4444', 
                        background: 'rgba(239, 68, 68, 0.03)', 
                        display: 'flex', 
                        gap: '8px', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Log Out Account
                    </button>
                  </div>
                </>
              ) : (
                <div className="profile-orders-list" style={{ maxHeight: '42dvh', overflowY: 'auto', paddingRight: '4px' }}>
                  {loadingOrders ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8) 0' }}>
                      <div className="checkout-spinner" style={{ borderTopColor: 'var(--fitti-green)', width: '24px', height: '24px' }}></div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--fitti-text-secondary)' }}>
                      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📦</span>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>No orders placed yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      {orders.map(order => (
                        <div 
                          key={order.id} 
                          className="profile-order-card"
                          style={{
                            border: '1px solid var(--fitti-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                            background: 'rgba(0,0,0,0.01)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-2)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--fitti-text-secondary)' }}>{order.id}</span>
                            <span 
                              className={`status-badge ${
                                (order.order_status || order.orderStatus) === 'Delivered' ? 'status-delivered' :
                                (order.order_status || order.orderStatus) === 'Cancelled' ? 'status-cancelled' :
                                'status-pending'
                              }`}
                              style={{ fontSize: '0.625rem' }}
                            >
                              {order.order_status || order.orderStatus || 'Pending'}
                            </span>
                          </div>
                          
                          <div className="divider" style={{ margin: '4px 0', borderBottom: '1px solid var(--fitti-border)' }}></div>
                          
                          <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {Array.isArray(order.products) ? (
                              order.products.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fitti-text)' }}>
                                  <span>{p.name || p.shortName} <span className="text-muted" style={{ fontSize: '0.75rem' }}>x{p.quantity}</span></span>
                                  <span className="font-mono">₹{p.price * p.quantity * (order.days || 1)}</span>
                                </div>
                              ))
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fitti-text)' }}>
                                <span>Custom Breakfast Plan</span>
                                <span className="font-mono">₹{order.total}</span>
                              </div>
                            )}
                          </div>

                          <div className="divider" style={{ margin: '4px 0', borderBottom: '1px solid var(--fitti-border)' }}></div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                            <span style={{ color: 'var(--fitti-text-muted)', fontSize: '0.75rem' }}>
                              {new Date(order.created_at || order.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span style={{ fontWeight: 800, color: 'var(--fitti-green-dark)' }}>
                              Total Paid: ₹{order.total}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{ background: 'var(--fitti-green-5)', color: 'var(--fitti-green-dark)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.625rem', fontWeight: 700 }}>
                              ⏳ {order.days} Days Plan
                            </span>
                            <span style={{ background: 'var(--fitti-green-5)', color: 'var(--fitti-green-dark)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.625rem', fontWeight: 700 }}>
                              📅 {order.schedule === 'custom' ? `Custom: ${Array.isArray(order.custom_delivery_days || order.customDeliveryDays) ? (order.custom_delivery_days || order.customDeliveryDays).join(', ') : 'Selected'}` : (order.schedule === 'weekdays' ? 'Weekdays' : 'Consecutive')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {mode === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="profile-modal-header" style={{ marginBottom: 'var(--space-4)' }}>
                <h3>Edit Profile</h3>
                <p>Modify your parameters below. Changes sync automatically.</p>
              </div>

              {error && <div className="form-error-banner">{error}</div>}

              <form onSubmit={handleFormSubmit} className="profile-edit-form" style={{ maxHeight: '70dvh', overflowY: 'auto', paddingRight: '4px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="profile-edit-row-3">
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DOB</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dob}
                      onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone 1 *</label>
                    <input
                      type="tel"
                      className="form-input"
                      maxLength="10"
                      value={formData.phone_number_1}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number_1: e.target.value.replace(/\D/g, '') }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone 2 (Optional)</label>
                  <input
                    type="tel"
                    className="form-input"
                    maxLength="10"
                    value={formData.phone_number_2}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number_2: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>

                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8125rem', borderBottom: '1px solid var(--fitti-border)', paddingBottom: '3px', marginTop: 'var(--space-2)' }}>Delivery Address</h4>

                <div className="profile-edit-row-3">
                  <div className="form-group">
                    <label className="form-label">House No</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.house_no}
                      onChange={(e) => setFormData(prev => ({ ...prev, house_no: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Street</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Area</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.area}
                      onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="profile-edit-row-3" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label">Locality / Landmark</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.locality}
                      onChange={(e) => setFormData(prev => ({ ...prev, locality: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      className="form-input"
                      maxLength="6"
                      value={formData.pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    required
                  />
                </div>

                <div className="profile-edit-actions" style={{ marginTop: 'var(--space-2)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setMode('view')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}


        </AnimatePresence>
      </motion.div>
    </div>
  );
}
