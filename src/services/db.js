import { supabase } from '../supabaseClient';

const LOCAL_STORAGE_KEY = 'fitti_user_profile';

export const dbService = {
  /**
   * Save or upsert the user profile details.
   */
  async saveProfile(profile) {
    const formattedProfile = {
      id: profile.email, // Use email as unique identifier
      name: profile.name || null,
      email: profile.email,
      age: profile.age ? parseInt(profile.age, 10) : null,
      dob: profile.dob || null,
      house_no: profile.house_no || null,
      street: profile.street || null,
      area: profile.area || null,
      locality: profile.locality || null,
      city: profile.city || null,
      pincode: profile.pincode || null,
      state: profile.state || null,
      phone_number_1: profile.phone_number_1 || null,
      phone_number_2: profile.phone_number_2 || null,
      birthday_discount_used: profile.birthday_discount_used || false,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(formattedProfile);
        
        if (error) throw error;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formattedProfile));
        return { success: true, data: formattedProfile };
      } catch (err) {
        console.warn('Supabase saveProfile failed, saving to LocalStorage instead:', err.message);
      }
    }

    // Local fallback
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formattedProfile));
    return { success: true, data: formattedProfile };
  },

  /**
   * Fetch user profile details by email.
   */
  async getProfile(email) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          return { success: true, data };
        }
      } catch (err) {
        console.warn('Supabase getProfile failed, reading from LocalStorage instead:', err.message);
      }
    }

    // Local fallback
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.email === email) {
        return { success: true, data: parsed };
      }
    }
    return { success: true, data: null };
  },

  /**
   * Update specific profile fields (e.g., address, name, age, mobile number).
   */
  async updateProfileFields(email, fields) {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...fields,
            updated_at: new Date().toISOString()
          })
          .eq('email', email);

        if (error) throw error;
      } catch (err) {
        console.warn('Supabase updateProfileFields failed, updating LocalStorage:', err.message);
      }
    }

    // Sync LocalStorage
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.email === email) {
        const updated = { ...parsed, ...fields };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return { success: true, data: updated };
      }
    }
    return { success: false, error: 'Profile not found' };
  },

  /**
   * Save an order to the Supabase database.
   */
  async saveOrder(order) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert({
            id: order.id,
            email: order.email || null,
            full_name: order.fullName || null,
            phone: order.phone || null,
            address: order.address || null,
            area: order.area || null,
            pincode: order.pincode || null,
            landmark: order.landmark || null,
            food_preference: order.foodPreference || null,
            notes: order.notes || null,
            payment_method: order.paymentMethod || null,
            payer_name: order.payerName || null,
            transaction_id: order.transactionId || null,
            razorpay_payment_id: order.razorpayPaymentId || null,
            products: order.products || null,
            days: order.days || null,
            delivery_slot: order.deliverySlot || null,
            schedule: order.schedule || null,
            custom_delivery_days: order.customDeliveryDays || null,
            total: order.total || null,
            created_at: order.createdAt || new Date().toISOString(),
            payment_status: order.paymentStatus || null,
            order_status: order.orderStatus || null
          });

        if (error) throw error;
        return { success: true };
      } catch (err) {
        console.warn('Supabase saveOrder failed, sync with LocalStorage instead:', err.message);
      }
    }
    return { success: true };
  },

  /**
   * Fetch all orders for a specific user email.
   */
  async getUserOrders(email) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          // Sync to local fitti-orders for cache
          const localOrders = JSON.parse(localStorage.getItem('fitti-orders') || '[]');
          const merged = [...data, ...localOrders.filter(lo => !data.some(so => so.id === lo.id))];
          localStorage.setItem('fitti-orders', JSON.stringify(merged));
          return { success: true, data };
        }
      } catch (err) {
        console.warn('Supabase getUserOrders failed, loading from LocalStorage instead:', err.message);
      }
    }

    // Local fallback
    const local = localStorage.getItem('fitti-orders');
    if (local) {
      const parsed = JSON.parse(local);
      const filtered = parsed.filter(o => o.email === email);
      // Sort by date descending
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, data: filtered };
    }
    return { success: true, data: [] };
  }
};
