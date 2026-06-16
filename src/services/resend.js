/**
 * Generates a unique 4-character verification code with the format:
 * - Char 1: Alphabet (A-Z)
 * - Char 2: Number (0-9)
 * - Char 3: Alphabet (A-Z)
 * - Char 4: Alphanumeric (A-Z or 0-9)
 */
export function generateVerificationCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const alphanumerics = letters + digits;

  const char1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const char2 = digits.charAt(Math.floor(Math.random() * digits.length));
  const char3 = letters.charAt(Math.floor(Math.random() * letters.length));
  const char4 = alphanumerics.charAt(Math.floor(Math.random() * alphanumerics.length));

  return `${char1}${char2}${char3}${char4}`;
}

/**
 * Sends a mobile number verification email via the Resend API.
 * Uses the proxy defined in vite.config.js to bypass browser CORS checks.
 */
export async function sendVerificationEmail(email, code) {
  try {
    const response = await fetch('/api/resend/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Fitti - Mobile Number Verification Code',
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 800; color: #76b900; letter-spacing: -0.04em;">Fitti.</span>
            </div>
            <h2 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px; text-align: center;">Verify Mobile Number Update</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              You requested to update your mobile number on your Fitti profile. Enter the unique 4-character code below to verify this action:
            </p>
            <div style="background-color: #fdfbf7; border: 1.5px dashed #76b900; padding: 20px; border-radius: 12px; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; color: #1a1a1a; margin: 24px auto; max-width: 200px;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px; line-height: 1.5;">
              If you did not request this update, please ignore this email. Verification codes expire shortly.
            </p>
          </div>
        `,
      }),
    });

    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    console.error('Resend API call error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a custom-designed HTML order receipt email via the Resend API.
 * Uses the proxy defined in vite.config.js to bypass browser CORS checks.
 */
export async function sendOrderReceiptEmail(email, order) {
  try {
    const isProductsArray = Array.isArray(order.products);
    const dateFormatted = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generate HTML rows for items
    let itemsHtml = '';
    if (isProductsArray && order.products.length > 0) {
      order.products.forEach(p => {
        const itemTotal = p.price * p.quantity * order.days;
        itemsHtml += `
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 0; font-size: 14px; color: #1a1a1a;">
              <strong>${p.name}</strong>
              <div style="font-size: 12px; color: #6b7280;">₹${p.price} &times; ${p.quantity} qty &times; ${order.days} days</div>
            </td>
            <td style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: 700; color: #1a1a1a;">₹${itemTotal}</td>
          </tr>
        `;
      });
    } else {
      const itemTotal = (order.product?.price || 0) * order.days;
      itemsHtml += `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 0; font-size: 14px; color: #1a1a1a;">
            <strong>${order.product?.name || 'Fitti Breakfast Plan'}</strong>
            <div style="font-size: 12px; color: #6b7280;">₹${order.product?.price || 0} &times; 1 qty &times; ${order.days} days</div>
          </td>
          <td style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: 700; color: #1a1a1a;">₹${itemTotal}</td>
        </tr>
      `;
    }

    const response = await fetch('/api/resend/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: email,
        subject: `Fitti - Order Receipt #${order.id}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
            
            <!-- Logo Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 32px; font-weight: 900; color: #76b900; letter-spacing: -0.04em;">Fitti<span style="color: #111111;">.</span></span>
              <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Healthy Breakfast. Fully Managed.</p>
            </div>

            <!-- Intro -->
            <div style="background: linear-gradient(135deg, #fdfbf7 0%, #f7f9f2 100%); border: 1px solid #e2ebd5; padding: 24px; border-radius: 16px; margin-bottom: 32px; text-align: center;">
              <h2 style="font-size: 20px; font-weight: 800; color: #111111; margin: 0 0 8px 0;">Order Placed Successfully! 🎉</h2>
              <p style="font-size: 14px; color: #4b5563; margin: 0; line-height: 1.5;">
                Thank you for upgrading your morning with Fitti, <strong>${order.fullName}</strong>. We have received your order details and are preparing your breakfast plan delivery.
              </p>
            </div>

            <!-- Order Metadata Info -->
            <table style="width: 100%; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px; margin-bottom: 24px; font-size: 13px; color: #6b7280;">
              <tr>
                <td style="text-align: left;">
                  <strong>ORDER ID:</strong> <span style="font-family: monospace; color: #111111; font-weight: 600;">${order.id}</span>
                </td>
                <td style="text-align: right;">
                  <strong>DATE:</strong> <span style="color: #111111;">${dateFormatted} ${timeFormatted}</span>
                </td>
              </tr>
            </table>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
              <thead>
                <tr style="border-bottom: 2px solid #111111;">
                  <th style="text-align: left; padding-bottom: 8px; font-size: 12px; font-weight: 800; color: #6b7280; letter-spacing: 0.05em; text-transform: uppercase;">Ordered Breakfast</th>
                  <th style="text-align: right; padding-bottom: 8px; font-size: 12px; font-weight: 800; color: #6b7280; letter-spacing: 0.05em; text-transform: uppercase;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Details & Pricing -->
            <div style="background-color: #fafafa; border-radius: 16px; padding: 20px; margin-bottom: 32px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #111111; margin: 0 0 16px 0; border-bottom: 1px solid #eeeeee; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Plan Details</h3>
              
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr style="height: 28px;">
                  <td style="color: #6b7280; text-align: left;">Subscription Duration:</td>
                  <td style="font-weight: 600; color: #111111; text-align: right;">${order.days} Days</td>
                </tr>
                <tr style="height: 28px;">
                  <td style="color: #6b7280; text-align: left;">Delivery Schedule:</td>
                  <td style="font-weight: 600; color: #111111; text-align: right;">
                    ${order.schedule === 'custom' ? `Custom Days (${order.customDays ? order.customDays.join(', ') : 'Selected'})` : 'Consecutive Days'}
                  </td>
                </tr>
                <tr style="height: 28px;">
                  <td style="color: #6b7280; text-align: left;">Delivery Time Slot:</td>
                  <td style="font-weight: 600; color: #111111; text-align: right;">${order.deliverySlot?.label || 'Morning'}</td>
                </tr>
                ${order.proteinBoost ? `
                <tr style="height: 28px;">
                  <td style="color: #6b7280; text-align: left;">Protein Boost Add-on:</td>
                  <td style="font-weight: 600; color: #76b900; text-align: right;">Yes (+₹${order.days * 20})</td>
                </tr>
                ` : ''}
                <tr style="height: 28px;">
                  <td style="color: #6b7280; text-align: left;">Payment Status:</td>
                  <td style="font-weight: 700; color: #16a34a; text-align: right;">${order.paymentStatus}</td>
                </tr>
                <tr style="height: 28px;">
                  <td style="color: #6b7280; text-align: left;">Reference / Transaction ID:</td>
                  <td style="font-family: monospace; font-size: 12px; color: #111111; text-align: right;">${order.razorpayPaymentId || order.transactionId || 'Pending'}</td>
                </tr>
                <tr style="height: 36px; border-top: 1px solid #eeeeee;">
                  <td style="font-size: 16px; font-weight: 800; color: #111111; text-align: left; padding-top: 8px;">Grand Total Paid:</td>
                  <td style="font-size: 18px; font-weight: 900; color: #76b900; text-align: right; padding-top: 8px;">₹${order.total}</td>
                </tr>
              </table>
            </div>

            <!-- Delivery Address -->
            <div style="border: 1px solid #f0f0f0; border-radius: 16px; padding: 20px; margin-bottom: 32px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #111111; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Delivery Address</h3>
              <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0;">
                <strong>${order.fullName}</strong><br />
                ${order.houseNo ? `${order.houseNo}, ` : ''}${order.address || ''}<br />
                ${order.locality ? `${order.locality}, ` : ''}${order.area || ''}<br />
                ${order.city || ''} &ndash; ${order.pincode || ''}<br />
                Primary Mobile: ${order.phone} ${order.phone2 ? `<br />Secondary Mobile: ${order.phone2}` : ''}
              </p>
            </div>

            <!-- Footer Message -->
            <div style="text-align: center; border-top: 1px solid #f0f0f0; padding-top: 24px;">
              <p style="font-size: 14px; color: #111111; font-weight: 600; margin: 0 0 4px 0;">Need to customize or adjust your schedule?</p>
              <p style="font-size: 12px; color: #6b7280; margin: 0 0 16px 0; line-height: 1.4;">You can easily update your delivery days or pause your subscription. Just contact us via WhatsApp or reply to this mail.</p>
              <a href="https://wa.me/919092184238" style="display: inline-block; background-color: #76b900; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 99px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(118, 185, 0, 0.2);">
                Contact Support on WhatsApp
              </a>
            </div>

          </div>
        `,
      }),
    });

    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    console.error('Resend receipt API error:', error);
    return { success: false, error: error.message };
  }
}

