import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';
import './WhyFitti.css';

const features = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4L20 12H28L22 18L24 26L16 22L8 26L10 18L4 12H12L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '20g+ Protein',
    desc: 'Real breakfast fuel. Not sugar-loaded bars.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 8v8l5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Fresh Daily',
    desc: 'Prepared every single morning. Never frozen.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 18L16 8L26 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 18V26H22V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 22H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Delivered Before Work',
    desc: 'Arrives before your day begins. 6–9 AM slots.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M8 14c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="6" y="14" width="20" height="4" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 18v6a2 2 0 002 2h8a2 2 0 002-2v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'No Prep Required',
    desc: 'Ready-to-consume. Just open and eat.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="8" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6v4M20 6v4M6 14h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Built For Busy Mornings',
    desc: 'Designed for working professionals on the go.',
  },
];

export default function WhyFitti() {
  return (
    <section className="section why-fitti-section" id="why-fitti">
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div className="eyebrow" style={{ display: 'inline-flex' }}>
              <span className="eyebrow-dot"></span>
              Why FITTI
            </div>
            <h2>Healthy Breakfast.<br /><span className="text-green">Fully Managed.</span></h2>
            <p>
              We handle everything — from sourcing ingredients to
              delivering at your door. You just wake up healthier.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid-5" stagger={0.1}>
          {features.map((feature, i) => (
            <StaggerItem key={i}>
              <div className="why-card">
                <div className="why-card-icon">{feature.icon}</div>
                <h3 className="why-card-title">{feature.title}</h3>
                <p className="why-card-desc">{feature.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
