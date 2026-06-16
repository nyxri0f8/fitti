export const products = [
  {
    id: 'choco-fuel',
    name: 'FITTI Choco Fuel',
    shortName: 'Choco Fuel',
    description: 'Chocolate protein breakfast smoothie',
    protein: '21g+',
    price: 99,
    category: 'smoothie',
    color: '#5C3D2E',
    gradient: 'linear-gradient(135deg, #5C3D2E 0%, #8B6914 100%)',
    emoji: '🍫',
  },
  {
    id: 'peanut-power',
    name: 'FITTI Peanut Power',
    shortName: 'Peanut Power',
    description: 'Banana peanut breakfast smoothie',
    protein: '20g+',
    price: 99,
    category: 'smoothie',
    color: '#C4903D',
    gradient: 'linear-gradient(135deg, #C4903D 0%, #E8B84B 100%)',
    emoji: '🥜',
  },
  {
    id: 'power-bowl',
    name: 'FITTI Power Bowl',
    shortName: 'Power Bowl',
    description: 'High-protein breakfast bowl',
    protein: '35g+',
    price: 120,
    category: 'bowl',
    color: '#4A7C3F',
    gradient: 'linear-gradient(135deg, #4A7C3F 0%, #76b900 100%)',
    emoji: '🥣',
  },
  {
    id: 'breakfast-combo',
    name: 'FITTI Breakfast Combo',
    shortName: 'Breakfast Combo',
    description: 'Any smoothie + Power Bowl',
    protein: '40g+',
    price: 219,
    category: 'combo',
    color: '#76b900',
    gradient: 'linear-gradient(135deg, #76b900 0%, #4A7C3F 100%)',
    emoji: '🍽️',
  },
];

export const deliverySlots = [
  { id: '6-7', label: '6–7 AM', time: '6:00 AM' },
  { id: '7-8', label: '7–8 AM', time: '7:00 AM' },
  { id: '8-9', label: '8–9 AM', time: '8:00 AM' },
];

export const scheduleOptions = [
  { id: 'consecutive', label: 'Consecutive Days', desc: 'Every day in a row' },
  { id: 'weekdays', label: 'Weekdays Only', desc: 'Mon–Fri' },
  { id: 'custom', label: 'Custom Days', desc: 'You choose' },
];

export const dayPresets = [1, 3, 5, 10, 20, 30];

export const proteinBoostPrice = 39;

export const orderStatuses = [
  'New Order',
  'Payment Pending',
  'Payment Verified',
  'Preparing',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
];

export const whatsappNumber = '919999999999'; // Replace with actual number
export const upiId = 'fitti@upi'; // Replace with actual UPI ID
