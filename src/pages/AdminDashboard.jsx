import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { orderStatuses } from '../data/products';
import './AdminDashboard.css';

export default function AdminDashboard({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('fitti-orders') || '[]');
    setOrders(stored.reverse());
  }, []);

  const updateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, orderStatus: newStatus } : o
    );
    setOrders(updated);
    localStorage.setItem('fitti-orders', JSON.stringify([...updated].reverse()));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
    }
  };

  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter(o => o.orderStatus === statusFilter);

  const getStatusClass = (status) => {
    const map = {
      'New Order': 'status-new',
      'Payment Pending': 'status-pending',
      'Payment Verified': 'status-verified',
      'Preparing': 'status-preparing',
      'Out For Delivery': 'status-delivery',
      'Delivered': 'status-delivered',
      'Cancelled': 'status-cancelled',
    };
    return map[status] || 'status-new';
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-inner">
            <button className="checkout-back" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Site
            </button>
            <div className="admin-title-row">
              <h1 className="admin-title">
                <span className="footer-logo-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#76b900', display: 'inline-block' }}></span>
                {' '}FITTI Admin
              </h1>
              <span className="admin-order-count">{orders.length} orders</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        {/* Status Filter */}
        <div className="admin-filters">
          <button
            className={`chip ${statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All')}
          >
            All ({orders.length})
          </button>
          {orderStatuses.map(status => {
            const count = orders.filter(o => o.orderStatus === status).length;
            return (
              <button
                key={status}
                className={`chip ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="admin-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="12" width="32" height="28" rx="4" stroke="#9ca3af" strokeWidth="2"/>
              <path d="M16 22h16M16 28h10" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>No orders {statusFilter !== 'All' ? `with status "${statusFilter}"` : 'yet'}</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} onClick={() => setSelectedOrder(order)} className="admin-table-row">
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>{order.id}</td>
                    <td>
                      <span className="admin-customer-name">{order.fullName}</span>
                      <span className="admin-customer-phone">{order.phone}</span>
                    </td>
                    <td>
                      {order.products ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {order.products.map(p => (
                            <span key={p.id} style={{ fontSize: '0.8125rem' }}>
                              {p.shortName} <span className="text-muted" style={{ fontSize: '0.75rem' }}>x{p.quantity}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        order.product?.shortName || order.product?.name
                      )}
                    </td>
                    <td>{order.days}d</td>
                    <td className="font-mono">₹{order.total}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-status-select"
                        value={order.orderStatus}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {orderStatuses.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              className="admin-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              className="admin-modal"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="admin-modal-header">
                <h3>Order Details</h3>
                <button onClick={() => setSelectedOrder(null)} className="admin-modal-close">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Order ID</span>
                  <span className="font-mono">{selectedOrder.id}</span>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Customer</span>
                  <span>{selectedOrder.fullName}</span>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Phone</span>
                  <span className="font-mono">{selectedOrder.phone}</span>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Products</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedOrder.products ? (
                      selectedOrder.products.map(p => (
                        <div key={p.id} style={{ fontSize: '0.875rem' }}>
                          {p.name} <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>x{p.quantity}</span> (₹{p.price}/day)
                        </div>
                      ))
                    ) : (
                      <div>{selectedOrder.product?.name}</div>
                    )}
                  </div>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Duration</span>
                  <span>{selectedOrder.days} Days</span>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Protein Boost</span>
                  <span>{selectedOrder.proteinBoost ? 'Yes' : 'No'}</span>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Delivery Slot</span>
                  <span>{selectedOrder.deliverySlot?.label}</span>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Schedule</span>
                  <span>{selectedOrder.schedule}</span>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Address</span>
                  <span>{selectedOrder.address}, {selectedOrder.area} - {selectedOrder.pincode}</span>
                </div>
                {selectedOrder.landmark && (
                  <div className="admin-detail-group">
                    <span className="admin-detail-label">Landmark</span>
                    <span>{selectedOrder.landmark}</span>
                  </div>
                )}
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Food Pref</span>
                  <span style={{ textTransform: 'capitalize' }}>{selectedOrder.foodPreference}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="admin-detail-group">
                    <span className="admin-detail-label">Notes</span>
                    <span>{selectedOrder.notes}</span>
                  </div>
                )}
                {selectedOrder.razorpayPaymentId && (
                  <div className="admin-detail-group">
                    <span className="admin-detail-label">Razorpay Payment ID</span>
                    <span className="font-mono">{selectedOrder.razorpayPaymentId}</span>
                  </div>
                )}
                {selectedOrder.paymentMethod === 'manual-upi' && selectedOrder.transactionId && (
                  <div className="admin-detail-group">
                    <span className="admin-detail-label">UPI UTR / Trans ID</span>
                    <span className="font-mono">{selectedOrder.transactionId}</span>
                  </div>
                )}
                {!selectedOrder.razorpayPaymentId && selectedOrder.paymentMethod !== 'manual-upi' && selectedOrder.transactionId && (
                  <div className="admin-detail-group">
                    <span className="admin-detail-label">Transaction ID</span>
                    <span className="font-mono">{selectedOrder.transactionId}</span>
                  </div>
                )}
                {selectedOrder.payerName && (
                  <div className="admin-detail-group">
                    <span className="admin-detail-label">Payer Name</span>
                    <span>{selectedOrder.payerName}</span>
                  </div>
                )}
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Payment Method</span>
                  <span style={{ textTransform: 'capitalize' }}>
                    {selectedOrder.paymentMethod === 'razorpay' ? 'Razorpay Gateway' : (selectedOrder.paymentMethod === 'manual-upi' ? 'Manual UPI' : (selectedOrder.paymentMethod || 'Manual UPI'))}
                  </span>
                </div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label">Payment Status</span>
                  <span className={selectedOrder.paymentStatus === 'Payment Verified' ? 'text-green' : ''} style={{ fontWeight: 600 }}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div className="divider"></div>
                <div className="admin-detail-group">
                  <span className="admin-detail-label" style={{ fontWeight: 700 }}>Amount</span>
                  <span className="price price-large">₹{selectedOrder.total}</span>
                </div>

                <div style={{ marginTop: 'var(--space-4)' }}>
                  <label className="form-label">Update Status</label>
                  <select
                    className="form-input"
                    value={selectedOrder.orderStatus}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  >
                    {orderStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
