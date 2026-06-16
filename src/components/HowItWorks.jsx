import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';
import './HowItWorks.css';

const steps = [
  {
    num: '01',
    title: 'Choose Your Breakfast',
    desc: 'Pick from our protein-packed smoothies and bowls.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 14l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Select Your Mornings',
    desc: 'Choose 1 to 30 days. Flexibility built in.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 4v4M18 4v4M4 12h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Complete Payment',
    desc: 'Quick UPI payment. No registration needed.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="7" width="22" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 12h22" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Breakfast Delivered',
    desc: 'Fresh breakfast at your door + WhatsApp confirmation.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 14l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div className="eyebrow" style={{ display: 'inline-flex' }}>
              <span className="eyebrow-dot"></span>
              How It Works
            </div>
            <h2>From Order to <span className="text-green">Doorstep</span></h2>
            <p>Four simple steps to healthier mornings. No app needed.</p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="how-steps" stagger={0.15}>
          {steps.map((step, i) => (
            <StaggerItem key={i}>
              <div className="how-step">
                <div className="how-step-number">
                  <span>{step.num}</span>
                </div>
                {i < steps.length - 1 && <div className="how-step-line"></div>}
                <div className="how-step-icon">{step.icon}</div>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-desc">{step.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
