import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import './Hero.css';

export default function Hero({ onNavigate }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section className="hero" ref={heroRef} id="hero">
      {/* Background glow orbs */}
      <div className="hero-glow hero-glow-1"></div>
      <div className="hero-glow hero-glow-2"></div>

      <motion.div className="container hero-content" style={{ y, opacity }}>
        <motion.div
          className="hero-text-centered"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
        >
          <h1 className="hero-title">
            Fitti<span className="hero-title-dot">.</span>
          </h1>

          <p className="hero-subtitle">
            Fitness. Fully Managed.
          </p>

          <div className="hero-actions-centered">
            <button 
              className="btn btn-primary btn-lg" 
              onClick={() => onNavigate && onNavigate('#order')}
            >
              BUILD YOUR MEAL
            </button>
            <button 
              className="btn btn-secondary btn-lg" 
              onClick={() => onNavigate && onNavigate('#products')}
            >
              EXPLORE PLANS
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
