import { motion } from 'framer-motion';
import './ProductCard.css';

export default function ProductCard({ product, onAdd, index = 0 }) {
  return (
    <motion.div
      className="product-card double-bezel"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="double-bezel-inner">
        <div className="product-card-image" style={{ background: product.gradient, padding: product.image ? 0 : undefined, overflow: 'hidden' }}>
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="product-card-img-element"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          ) : (
            <div className="product-card-image-inner">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                {product.category === 'smoothie' && (
                  <>
                    <rect x="22" y="18" width="36" height="48" rx="6" fill="white" opacity="0.2"/>
                    <rect x="26" y="12" width="28" height="6" rx="3" fill="white" opacity="0.3"/>
                    <circle cx="40" cy="42" r="10" fill="white" opacity="0.15"/>
                    <path d="M32 38c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
                  </>
                )}
                {product.category === 'bowl' && (
                  <>
                    <ellipse cx="40" cy="46" rx="24" ry="16" fill="white" opacity="0.2"/>
                    <path d="M18 42c0-6 10-16 22-16s22 10 22 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
                    <circle cx="32" cy="42" r="4" fill="white" opacity="0.2"/>
                    <circle cx="48" cy="40" r="5" fill="white" opacity="0.15"/>
                    <circle cx="40" cy="46" r="4" fill="white" opacity="0.2"/>
                  </>
                )}
                {product.category === 'combo' && (
                  <>
                    <rect x="14" y="20" width="24" height="36" rx="5" fill="white" opacity="0.2"/>
                    <ellipse cx="52" cy="46" rx="16" ry="10" fill="white" opacity="0.2"/>
                    <path d="M38 40c0-4 6-10 14-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                    <circle cx="22" cy="36" r="4" fill="white" opacity="0.15"/>
                    <path d="M18 32c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                  </>
                )}
              </svg>
            </div>
          )}
          <div className="product-card-protein-badge">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1l1.5 3 3.5.5-2.5 2.4.6 3.4L6 8.8 2.9 10.3l.6-3.4L1 4.5 4.5 4z" fill="currentColor"/>
            </svg>
            {product.protein} Protein
          </div>
        </div>

        <div className="product-card-body">
          <h3 className="product-card-name">{product.name}</h3>
          <p className="product-card-desc">{product.description}</p>

          <div className="product-card-footer">
            <div className="product-card-price">
              <span className="price">₹{product.price}</span>
              <span className="product-card-price-unit">/day</span>
            </div>
            <motion.button
              className="btn btn-primary btn-sm"
              whileTap={{ scale: 0.94 }}
              onClick={() => onAdd && onAdd(product)}
            >
              Add
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
