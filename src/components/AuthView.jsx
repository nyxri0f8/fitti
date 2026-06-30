import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { dbService } from '../services/db';
import './AuthView.css';

export default function AuthView({ initialGoogleUser, onAuthSuccess, onCancel }) {
  const [step, setStep] = useState('connect'); // 'connect' | 'profile'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Structured profile form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    age: '',
    phone_number_1: '',
    phone_number_2: '',
    house_no: '',
    street: '',
    area: '',
    locality: '',
    city: '',
    pincode: '',
    state: ''
  });

  // Handle case where user is redirected back from Google OAuth
  useEffect(() => {
    if (initialGoogleUser) {
      if (initialGoogleUser.phone_number_1) {
        // Profile already complete! Bypass onboarding.
        onAuthSuccess && onAuthSuccess(initialGoogleUser);
        return;
      }
      setFormData(prev => ({
        ...prev,
        name: initialGoogleUser.name || prev.name,
        email: initialGoogleUser.email || prev.email,
        dob: initialGoogleUser.dob || prev.dob,
        age: initialGoogleUser.age || prev.age,
        phone_number_1: initialGoogleUser.phone_number_1 || prev.phone_number_1,
        phone_number_2: initialGoogleUser.phone_number_2 || prev.phone_number_2,
        house_no: initialGoogleUser.house_no || prev.house_no,
        street: initialGoogleUser.street || prev.street,
        area: initialGoogleUser.area || prev.area,
        locality: initialGoogleUser.locality || prev.locality,
        city: initialGoogleUser.city || prev.city,
        pincode: initialGoogleUser.pincode || prev.pincode,
        state: initialGoogleUser.state || prev.state
      }));
      setStep('profile');
    }
  }, [initialGoogleUser, onAuthSuccess]);

  const handleGoogleConnect = async () => {
    setLoading(true);
    setError('');

    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      } catch (err) {
        console.error('Google OAuth error:', err);
        setError(err.message || 'Failed to initialize Google Sign-in.');
        setLoading(false);
      }
    } else {
      // Offline fallback: Simulate a Google popup connection
      setTimeout(async () => {
        const email = 'varungupta@gmail.com';
        const result = await dbService.getProfile(email);
        setLoading(false);
        if (result.success && result.data && result.data.phone_number_1) {
          // Fallback user profile is already complete!
          onAuthSuccess && onAuthSuccess(result.data);
        } else {
          setFormData(prev => ({
            ...prev,
            name: 'Varun Gupta',
            email: email,
            ...result.data
          }));
          setStep('profile');
        }
      }, 1500);
    }
  };

  const maxDobDate = (() => {
    const today = new Date();
    const year = today.getFullYear() - 18;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const handleDobChange = (e) => {
    const dobVal = e.target.value;
    const dobDate = new Date(dobVal);
    let calculatedAge = '';
    if (!isNaN(dobDate.getTime())) {
      const today = new Date();
      let calculated = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        calculated--;
      }
      calculatedAge = calculated > 0 ? String(calculated) : '';
    }
    setFormData(prev => ({ ...prev, dob: dobVal, age: calculatedAge }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!formData.name.trim()) return setError('Name is required');
    if (!formData.dob) return setError('Date of Birth is required');

    // Verify that the user is at least 18 years old
    const dobDate = new Date(formData.dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      calculatedAge--;
    }
    if (calculatedAge < 18) {
      return setError('You must be at least 18 years old to subscribe.');
    }

    if (!formData.age || parseInt(formData.age, 10) <= 0) return setError('Please enter a valid age');
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

    try {
      setLoading(true);
      const result = await dbService.saveProfile({
        ...formData,
        birthday_discount_used: false
      });
      setLoading(false);
      if (result.success) {
        onAuthSuccess && onAuthSuccess(result.data);
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      {/* Background glow orbs */}
      <div className="auth-glow auth-glow-1"></div>
      <div className="auth-glow auth-glow-2"></div>

      <div className="auth-card-wrapper">
        <AnimatePresence mode="wait">
          {step === 'connect' && (
            <motion.div
              key="connect"
              className="auth-card google-auth-card glass-panel"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="auth-header">
                <h2>Connect Your Account</h2>
                <p>Connect your Google account to customize plans and manage your breakfast delivery.</p>
              </div>

              {error && <div className="form-error-banner">{error}</div>}

              <div className="google-connect-buttons">
                <button
                  className="google-btn btn-lg w-full"
                  onClick={handleGoogleConnect}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' }}
                >
                  {loading ? (
                    <div className="pulse-loader" style={{ marginBottom: 0 }}>
                      <div className="loader-dot"></div>
                      <div className="loader-dot"></div>
                      <div className="loader-dot"></div>
                    </div>
                  ) : (
                    <>
                      <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Connect with Google Account</span>
                    </>
                  )}
                </button>
              </div>

              <div className="secure-badge-wrap" style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
                <div className="secure-badge">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                  Google OAuth 2.0 Secure Protocol
                </div>
              </div>

              <button className="auth-cancel-btn text-muted" onClick={onCancel}>
                ← Cancel & Return to Landing
              </button>
            </motion.div>
          )}

          {step === 'profile' && (
            <motion.div
              key="profile"
              className="auth-card profile-onboarding-card glass-panel"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="auth-header" style={{ marginBottom: 'var(--space-5)' }}>
                <h2>Complete Your Profile</h2>
                <p>Provide your delivery and contact details to proceed.</p>
              </div>

              {error && <div className="form-error-banner">{error}</div>}

              <form onSubmit={handleProfileSubmit} className="profile-onboarding-form">
                <div className="grid-2">
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
                  <div className="form-group">
                    <label className="form-label">Email (Read Only)</label>
                    <input
                      type="email"
                      className="form-input disabled-input"
                      value={formData.email}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dob}
                      onChange={handleDobChange}
                      max={maxDobDate}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 24"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Phone (Phone 1)</label>
                    <input
                      type="tel"
                      className="form-input"
                      maxLength="10"
                      placeholder="10-digit number"
                      value={formData.phone_number_1}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number_1: e.target.value.replace(/\D/g, '') }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Phone (Phone 2 - Optional)</label>
                  <input
                    type="tel"
                    className="form-input"
                    maxLength="10"
                    placeholder="Secondary contact number"
                    value={formData.phone_number_2}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number_2: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>

                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', borderBottom: '1px solid var(--fitti-border)', paddingBottom: '4px', marginTop: 'var(--space-2)' }}>Delivery Address</h4>
                
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">House / Flat No *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. #402"
                      value={formData.house_no}
                      onChange={(e) => setFormData(prev => ({ ...prev, house_no: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Street Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Green Valley Rd"
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Area *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Whitefield"
                      value={formData.area}
                      onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid-4">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Locality / Landmark</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Near Tech Park"
                      value={formData.locality}
                      onChange={(e) => setFormData(prev => ({ ...prev, locality: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter City"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="6-digit"
                      maxLength="6"
                      value={formData.pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-full" 
                  disabled={loading}
                  style={{ marginTop: 'var(--space-3)' }}
                >
                  {loading ? 'Submitting Details...' : 'Complete Profile & Get Welcome Ticket'}
                  <span className="btn-icon">→</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
