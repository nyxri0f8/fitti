import crypto from 'crypto';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(451).json({ error: 'Method Not Allowed' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature in request body',
    });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(500).json({
      error: 'Server Error',
      message: 'Razorpay secret key is not configured on the server',
    });
  }

  try {
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (generatedSignature === razorpay_signature) {
      return res.status(200).json({
        success: true,
        message: 'Payment signature verified successfully',
      });
    } else {
      console.warn('Payment verification failed. Signature mismatch.');
      return res.status(400).json({
        success: false,
        error: 'Signature mismatch',
        message: 'Payment verification failed. Signature mismatch.',
      });
    }
  } catch (error) {
    console.error('Error during signature verification:', error);
    return res.status(500).json({
      error: 'Verification Error',
      message: error.message || 'An error occurred during verification',
    });
  }
}
